const core = require('@actions/core');
const axios = require('axios');

async function fetchServiceId(portainerUrl, apiKey, endpointId, serviceName) {
    try {
        core.info(`Fetching Service ID for '${serviceName}'...`);
        const response = await axios.get(`${portainerUrl}/api/endpoints/${endpointId}/docker/services`, {
            headers: { 'X-API-Key': apiKey }
        });

        const service = response.data.find(svc => svc.Spec.Name === serviceName);
        if (!service) {
            core.setFailed(`Service '${serviceName}' not found!`);
            throw new Error(`Service '${serviceName}' not found.`);
        }

        core.info(`✅ Found Service ID: ${service.ID}`);
        return service.ID;
    } catch (error) {
        core.setFailed(`Failed to fetch service ID: ${error.message}`);
        throw error;
    }
}

async function fetchWebhook(portainerUrl, apiKey, serviceId) {
    try {
        core.info(`Checking for existing webhook...`);
        const response = await axios.get(`${portainerUrl}/api/webhooks`, {
            headers: { 'X-API-Key': apiKey }
        });

        const webhook = response.data.find(w => w.ResourceID === serviceId);
        if (webhook) {
            core.info(`✅ Webhook already exists: ${portainerUrl}/api/webhooks/${webhook.Id}`);
            return `${portainerUrl}/api/webhooks/${webhook.Id}`;
        }

        core.info(`⚠️ No webhook found for service ${serviceId}. Creating a new one.`);
        return null;
    } catch (error) {
        core.setFailed(`Failed to check for existing webhooks: ${error.message}`);
        throw error;
    }
}

async function createWebhook(portainerUrl, apiKey, serviceId, endpointId) {
    try {
        core.info(`Creating new webhook for service ID: ${serviceId}`);
        const response = await axios.post(`${portainerUrl}/api/webhooks`, {
            ResourceID: serviceId,
            EndpointID: parseInt(endpointId, 10),
            WebhookType: 1
        }, {
            headers: { 'X-API-Key': apiKey }
        });

        if (!response.data || !response.data.Id) {
            throw new Error(`Failed to create webhook, unexpected response: ${JSON.stringify(response.data)}`);
        }

        const webhookUrl = `${portainerUrl}/api/webhooks/${response.data.Id}`;
        core.info(`✅ Webhook created: ${webhookUrl}`);
        return webhookUrl;
    } catch (error) {
        core.setFailed(`Failed to create webhook: ${error.message}`);
        throw error;
    }
}

async function triggerWebhook(webhookUrl) {
    try {
        core.info(`Triggering webhook: ${webhookUrl}`);
        await axios.post(webhookUrl);
        core.info(`✅ Service redeployed successfully!`);
    } catch (error) {
        core.setFailed(`Failed to trigger webhook: ${error.message}`);
        throw error;
    }
}

async function main() {
    try {
        const portainerUrl = core.getInput('portainer_url').trim();
        const apiKey = core.getInput('api_key').trim();
        const endpointId = core.getInput('endpoint_id').trim();
        const serviceName = core.getInput('service_name').trim();

        // Step 1: Fetch Service ID
        const serviceId = await fetchServiceId(portainerUrl, apiKey, endpointId, serviceName);

        // Step 2: Check for existing webhook
        let webhookUrl = await fetchWebhook(portainerUrl, apiKey, serviceId);

        // Step 3: Create webhook if not found
        if (!webhookUrl) {
            webhookUrl = await createWebhook(portainerUrl, apiKey, serviceId, endpointId);
        }

        // Step 4: Trigger webhook to redeploy service
        await triggerWebhook(webhookUrl);

    } catch (error) {
        core.setFailed(`❌ Action failed: ${error.message}`);
    }
}

main();

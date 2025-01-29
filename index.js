const core = require('@actions/core');
const https = require('https');

function httpRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let responseBody = '';

            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(responseBody || '{}'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${responseBody}`));
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function fetchServiceId(portainerUrl, apiKey, endpointId, serviceName) {
    try {
        core.info(`Fetching Service ID for '${serviceName}'...`);
        const options = {
            hostname: new URL(portainerUrl).hostname,
            path: `/api/endpoints/${endpointId}/docker/services`,
            method: 'GET',
            headers: { 'X-API-Key': apiKey }
        };

        const services = await httpRequest(options);
        const service = services.find(svc => svc.Spec.Name === serviceName);
        if (!service) {
            throw new Error(`Service '${serviceName}' not found.`);
        }

        core.info(`✅ Found Service ID: ${service.ID}`);
        return service.ID;
    } catch (error) {
        core.setFailed(`Failed to fetch service ID: ${error.message}`);
        throw error;
    }
}

async function fetchWebhook(portainerUrl, apiKey, serviceId, retryCount = 3) {
    try {
        core.info(`Checking for existing webhook...`);
        const options = {
            hostname: new URL(portainerUrl).hostname,
            path: `/api/webhooks`,
            method: 'GET',
            headers: { 'X-API-Key': apiKey }
        };

        for (let i = 0; i < retryCount; i++) {
            const webhooks = await httpRequest(options);
            const webhook = webhooks.find(w => w.ResourceID === serviceId);

            if (webhook) {
                const webhookUrl = `${portainerUrl}/api/webhooks/${webhook.Id}`;
                core.info(`✅ Webhook found: ${webhookUrl}`);
                return webhookUrl;
            }

            core.info(`🔄 Webhook not found. Retrying in 3 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        core.warning(`⚠️ No webhook found for service ${serviceId} after retries.`);
        return null;
    } catch (error) {
        core.setFailed(`Failed to check for existing webhooks: ${error.message}`);
        throw error;
    }
}

async function createWebhook(portainerUrl, apiKey, serviceId, endpointId) {
    try {
        core.info(`Creating new webhook for service ID: ${serviceId}`);
        const options = {
            hostname: new URL(portainerUrl).hostname,
            path: `/api/webhooks`,
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                'Content-Type': 'application/json'
            }
        };

        const body = {
            ResourceID: serviceId,
            EndpointID: parseInt(endpointId, 10),
            WebhookType: 1
        };

        const response = await httpRequest(options, body);

        if (!response || !response.Id) {
            throw new Error(`Failed to create webhook, unexpected response: ${JSON.stringify(response)}`);
        }

        const webhookUrl = `${portainerUrl}/api/webhooks/${response.Id}`;
        core.info(`✅ Webhook created: ${webhookUrl}`);
        return webhookUrl;
    } catch (error) {
        if (error.message.includes('HTTP 409')) {
            core.info(`⚠️ Webhook already exists. Fetching existing webhook...`);
            return await fetchWebhook(portainerUrl, apiKey, serviceId);
        }

        core.setFailed(`Failed to create webhook: ${error.message}`);
        throw error;
    }
}

async function triggerWebhook(webhookUrl) {
    try {
        if (!webhookUrl) {
            throw new Error(`Webhook URL is null or undefined. Cannot trigger redeployment.`);
        }

        core.info(`Triggering webhook: ${webhookUrl}`);

        const options = {
            hostname: new URL(webhookUrl).hostname,
            path: new URL(webhookUrl).pathname,
            method: 'POST'
        };

        await httpRequest(options);
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

        // Step 2: Check for existing webhook (retry up to 3 times)
        let webhookUrl = await fetchWebhook(portainerUrl, apiKey, serviceId);

        // Step 3: If webhook does not exist, try creating it
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
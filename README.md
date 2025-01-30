# Portainer Service Update Action

This **GitHub Action** automates the process of **fetching, creating, and triggering a Portainer service webhook** to redeploy a service after a new Docker image is pushed.

---

## **Inputs**

| Name                      | Description                                                       | Required | Default |
|---------------------------|-------------------------------------------------------------------|----------|---------|
| `portainer_url`           | The URL of the Portainer server (e.g., `https://portainer.example.com`). | Yes   |         |
| `api_key`                 | API Key for Portainer authentication.                           | Yes   |         |
| `endpoint_id`             | The Portainer environment ID where the service is deployed. | Yes   |         |
| `service_name`            | The name of the Portainer service to update.                   | Yes   |         |

---

## **Example Usage in GitHub Actions**

### **GitHub Actions Workflow**
```yaml
jobs:
  portainer_service_update:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Trigger Portainer Webhook
        uses: enzodjabali/portainer-service-update-action@v1
        with:
          portainer_url: "https://portainer.example.com"
          api_key: ${{ secrets.PORTAINER_API_KEY }}
          endpoint_id: "1"
          service_name: "my-service"
```

---

## **How It Works**
1. **Fetches the service ID from Portainer**  
   - Uses `portainer_url`, `api_key`, `endpoint_id`, and `service_name` to retrieve the **correct service**.

2. **Checks if a webhook already exists**  
   - If a webhook **exists**, it **fetches the existing URL** instead of creating a new one.

3. **Creates a webhook if needed**  
   - If no webhook is found, it **creates one automatically**.

4. **Triggers the webhook to redeploy the service**  
   - Ensures the **latest service version is deployed** in Docker Swarm.

---

## **Development**

To test and run this GitHub Action locally, follow these steps:

### **1. Set Up Required Variables**
Ensure you have the following variables ready before running the action:
- `portainerUrl`
- `apiKey`
- `endpointId`
- `serviceName`

### **2. Run Locally with Docker**
You can execute the action in a local environment using Docker:

```sh
docker compose up --build
```

# Build and Push Action

This Gitea Action builds a Docker image for your project and pushes it to a Docker registry, with support for automatic tagging and pushing as the latest version.

## Features
- Builds a Docker image from the provided `Dockerfile`.
- Pushes the Docker image to a specified registry.
- Supports auto-tagging based on Git tags (e.g., `2`, `2.6`, `2.6.11` for tag `2.6.11`).
- Optionally pushes the image with the `latest` tag.

## Inputs

| Name             | Description                                                                 | Required | Default |
|------------------|-----------------------------------------------------------------------------|----------|---------|
| `docker_registry`| The Docker registry URL (e.g., `git.in.pointvision.fr`).                   | Yes      |         |
| `docker_username`| Username for the Docker registry.                                          | Yes      |         |
| `docker_password`| Password or token for the Docker registry.                                 | Yes      |         |
| `image_name`     | Name of the Docker image (e.g., `my-app`).                                | Yes      |         |
| `image_tag`      | Tag for the Docker image (e.g., `2.6.11`).                               | Yes      |         |
| `autotag`        | Boolean to enable auto-tagging based on the version (e.g., `2`, `2.6`).   | No       | `false` |
| `push_as_latest` | Boolean to push the image with the `latest` tag.                          | No       | `false` |

## Example Usage

### Workflow File
```yaml
jobs:
  build_and_push:
    name: Build and Push MyApp
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Build and Push Action
        uses: https://${{ secrets.REPO_ACCESS_TOKEN }}:@git.in.pointvision.fr/PointVision/build-and-push-action@1
        with:
          context: .
          docker_registry: git.in.pointvision.fr
          docker_username: ${{ secrets.REGISTRY_USERNAME }}
          docker_password: ${{ secrets.REGISTRY_PASSWORD }}
          image_name: pointvision/my-app
          image_tag: ${{ github.ref_name }}
          autotag: true
          push_as_latest: true
```

## Notes
- Ensure the required secrets (e.g., `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, `REPO_ACCESS_TOKEN`) are set in your repository settings.

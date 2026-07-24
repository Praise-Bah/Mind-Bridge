# Ansible Deployment - To Be Implemented / Adapted

## Purpose

Add Ansible as a repeatable deployment automation layer for MindBridge.
Ansible should not replace the existing Docker Compose or Kubernetes files.
Instead, it should automate VPS setup, production configuration, deployment,
SSL provisioning, and optional health-check scheduling around the current
Docker Compose production stack.

## Current Deployment Foundation

The project already contains the runtime deployment pieces:

- `infra/docker/docker-compose.prod.yml` defines the production services.
- `infra/nginx/nginx.prod.conf` defines the production API gateway.
- `infra/scripts/health_check_alert.sh` handles service health alerting.
- `infra/k8s/` contains Kubernetes manifests for a later scaling path.

Ansible should use the Docker Compose production path first because it matches
the current VPS deployment model.

## Ansible Work To Implement

- Create an Ansible structure under `infra/ansible/`.
- Add a production inventory with a placeholder VPS host.
- Add non-secret deployment variables in `group_vars/all.yml`.
- Add a `vault.yml.example` file for secrets that will later be encrypted with
  `ansible-vault`.
- Add a bootstrap playbook for preparing a fresh Ubuntu VPS.
- Add a deploy playbook for cloning/updating the repo and running Docker Compose.
- Add a site playbook that runs bootstrap and deploy together.
- Add roles for common server setup, Docker, SSL, MindBridge deployment, and
  optional health-check cron setup.
- Add templates for `.env.prod`, health-check alert variables, and Nginx cert
  renewal reload behavior.
- Update `.gitignore` so real Vault files are never committed.
- Add usage documentation explaining how to adapt the inventory, variables,
  secrets, and commands.

## Why This Is Needed

Without Ansible, production setup requires manual SSH work: installing Docker,
configuring firewall rules, creating environment files, requesting SSL
certificates, running Docker Compose, and wiring health checks.

With Ansible, the same deployment can be repeated on a new VPS or staging server
with only inventory and variable changes.

## Expected Playbook Flow

Bootstrap a fresh VPS:

```bash
cd infra/ansible
ansible-playbook playbooks/bootstrap.yml --ask-vault-pass
```

Deploy the application:

```bash
ansible-playbook playbooks/deploy.yml --ask-vault-pass
```

Run everything:

```bash
ansible-playbook playbooks/site.yml --ask-vault-pass
```

## Values To Adapt Before Use

- VPS IP address in `inventory/production/hosts.yml`.
- SSH user in `inventory/production/hosts.yml`.
- Repository URL in `inventory/production/group_vars/all.yml`.
- API domain in `inventory/production/group_vars/all.yml`.
- Let’s Encrypt email in `inventory/production/group_vars/all.yml`.
- Frontend URL or local frontend build mode.
- Health-check alert recipient if alert cron is enabled.
- All secrets in encrypted `inventory/production/group_vars/vault.yml`.

## Secret Handling

Real secrets must not be committed.

Create the Vault file from the example:

```bash
cp inventory/production/group_vars/vault.yml.example inventory/production/group_vars/vault.yml
ansible-vault encrypt inventory/production/group_vars/vault.yml
```

Secrets include:

- PostgreSQL password
- Django secret key
- Internal service token
- Google OAuth credentials
- SendGrid API key
- OpenRouter API key
- YouTube API key
- Optional Sentry and Grafana Cloud values

## Validation Still Needed

After Ansible is installed locally or on a control machine, run:

```bash
cd infra/ansible
ansible-playbook --syntax-check playbooks/site.yml --ask-vault-pass
```

Then test against a staging VPS before using it on production.

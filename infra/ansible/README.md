# MindBridge Ansible Deployment

This directory adds a repeatable Ansible layer around the production deployment
that already exists in this repo. It does not replace Docker Compose,
Kubernetes, or Nginx. For the current VPS path, Ansible prepares the server and
then runs the existing `infra/docker/docker-compose.prod.yml` stack.

## What This Automates

- Installs base VPS packages, Git, UFW, cron, and optional Node.js 20.
- Creates a `deploy` user with sudo and Docker access.
- Installs Docker Engine plus the Docker Compose plugin.
- Requests a Let's Encrypt certificate for the API domain.
- Clones or updates this repository on the VPS.
- Renders `infra/docker/.env.prod` from inventory and Vault variables.
- Adapts `infra/nginx/nginx.prod.conf` on the VPS when your API domain differs
  from the current `api.mindbridge.sbs` default.
- Optionally builds `frontend/dist` on the VPS for the containerized Nginx.
- Runs `docker compose -f docker-compose.prod.yml --env-file .env.prod up --build -d`.
- Optionally installs the existing `infra/scripts/health_check_alert.sh` cron.

## Directory Layout

```text
infra/ansible/
├── ansible.cfg
├── inventory/
│   └── production/
│       ├── hosts.yml
│       └── group_vars/
│           ├── all.yml
│           └── vault.yml.example
├── playbooks/
│   ├── bootstrap.yml
│   ├── deploy.yml
│   └── site.yml
└── roles/
    ├── common/
    ├── docker/
    ├── ssl/
    ├── mindbridge/
    └── healthcheck/
```

## First-Time Setup

Run commands from this directory:

```bash
cd infra/ansible
```

Install Ansible on your control machine:

```bash
python -m pip install ansible
```

Edit `inventory/production/hosts.yml`:

```yaml
ansible_host: YOUR_VPS_IP
ansible_user: root
```

Edit `inventory/production/group_vars/all.yml`:

- `mindbridge_repo_url`: your Git URL for this repository.
- `mindbridge_api_domain`: the domain that points to the VPS.
- `mindbridge_ssl_email`: your real Let's Encrypt email.
- `mindbridge_frontend_url`: your Vercel URL, or the VPS URL if self-hosting.
- `mindbridge_build_frontend`: set to `true` only if the VPS should build and
  serve `frontend/dist`.
- `mindbridge_enable_health_cron`: set to `true` when SendGrid alerting is ready.

Create and encrypt the secret file:

```bash
cp inventory/production/group_vars/vault.yml.example inventory/production/group_vars/vault.yml
ansible-vault encrypt inventory/production/group_vars/vault.yml
```

When running playbooks against an encrypted vault, add `--ask-vault-pass` unless
you configure another Vault password mechanism.

## Commands

Bootstrap a fresh Ubuntu VPS:

```bash
ansible-playbook playbooks/bootstrap.yml --ask-vault-pass
```

Deploy or update the app:

```bash
ansible-playbook playbooks/deploy.yml --ask-vault-pass
```

Run both bootstrap and deploy:

```bash
ansible-playbook playbooks/site.yml --ask-vault-pass
```

## Important Assumptions

- The production runtime remains Docker Compose. The playbook intentionally uses
  `infra/docker/docker-compose.prod.yml` instead of creating a second deployment
  definition in Ansible.
- The production Nginx config expects certificates in `/etc/letsencrypt`, mounted
  into the Nginx container. Keep `mindbridge_enable_ssl: true` unless you also
  change the Nginx config for non-HTTPS deployments.
- Certbot's first standalone certificate request needs port `80` free. Run
  `bootstrap.yml` before the Compose stack is already listening on port `80`, or
  temporarily stop the Nginx container before requesting a new certificate.
- If the repository is private, configure SSH access for the remote deploy user
  before running `deploy.yml`.
- Real secrets belong only in encrypted `vault.yml`, never in `all.yml`,
  `.env.prod`, or committed files.

## Adapting This Later

For a staging environment, copy `inventory/production` to `inventory/staging`,
change host/domain/branch values, and run:

```bash
ansible-playbook -i inventory/staging/hosts.yml playbooks/site.yml --ask-vault-pass
```

For Kubernetes, keep this directory as the VPS/Compose path and add a separate
playbook later that installs the cluster or applies files from `infra/k8s/`.

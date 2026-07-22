# Infraestrutura

## Servidor

- **Provider**: Hetzner Cloud
- **IP**: `46.62.232.76`
- **OS**: Ubuntu 24.04 LTS
- **RAM**: 2GB (tight) + 2GB swapfile em `/swapfile` (adicionado após OOM outage)
- **SSH**: key-based apenas

## ⚠️ Memória — risco real

2GB é genuinamente apertado. Durante deploy, monitorar em segundo terminal:

```bash
ssh root@46.62.232.76
watch -n 2 free -h
```

## Firewall

- UFW + Hetzner Cloud Firewall: portas 22, 80, 443, 3000 abertas
- fail2ban rodando (protege SSH)
- Atualizações de segurança automáticas via unattended-upgrades

## Dokploy

Dashboard: `http://46.62.232.76:3000`  
Docker Swarm. Traefik como reverse proxy (SSL via Let's Encrypt).

### Serviços

| Serviço | Nome interno Dokploy | Build type | Domínio |
|---------|---------------------|------------|---------|
| Backend | `click-casal-frontend` ⚠️ nome enganoso | Nixpacks | api.clickcasal.com.br |
| Frontend | ⚠️ confirmar nome no dashboard | Dockerfile | clickcasal.com.br |
| Postgres | `click-casal-clickcasaldb-*` | — | interno |

### Quirks aprendidos (não violar)

- "Static" build type não roda build command — usar Dockerfile para qualquer coisa que precisa de build step
- Build Path é o subfolder (`/frontend`). Docker File e Context Path são relativos a ele — não duplicar o path
- Domínios precisam de HTTPS + cert selecionado explicitamente por domínio no Dokploy
- Published Port ≠ Target Port. Target Port = porta que o container escuta (nginx = 80, backend = 3000)
- Env vars: salvar no Dokploy + redeploy. Apenas salvar não aplica
- O serviço do backend se chama "frontend" no Dokploy — não renomear sem testar webhooks

## DNS

Registrado em registro.br. A records:
- `clickcasal.com.br` → `46.62.232.76`
- `api.clickcasal.com.br` → `46.62.232.76`

## GitHub

- Repo: `github.com/PedroMiranda123/click-casal` (público)
- Branch principal: `main`
- Auto-deploy: push para `main` → webhook Dokploy → rebuild
- CI (`.github/workflows/ci.yml`): apenas testa backend (`npm ci` + `npm test`)
- ⚠️ Sem job de frontend no CI — erros de TypeScript/build só aparecem no deploy

## Comandos úteis

```bash
# SSH
ssh root@46.62.232.76

# Containers rodando
docker ps

# Logs de container
docker logs <container-name> --tail 50

# Aplicar migration manualmente (normalmente desnecessário — roda no boot)
docker exec -it <container-id> npx prisma migrate deploy

# Seed
docker exec -it <container-id> npx prisma db seed

# Monitorar memória durante deploy
watch -n 2 free -h

# DNS
dig clickcasal.com.br +short
dig api.clickcasal.com.br +short
```

## Problema conhecido: Claude Code cloud sessions

Cloud/remote sessions do Claude Code falham no `git push` (403, bug conhecido). **Fix**: usar Claude Desktop → aba Code → Local session. Esse é o padrão atual do projeto.

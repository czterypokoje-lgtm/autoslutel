# KeyForCars local staff model

The staff-chat route uses the loopback Ollama chat API and qwen3:4b. It does not use OpenClaw or a hosted model. Results from Ollama select from a small list of intents. CRM roles and lookups stay on the server. The model call does not accept a caller-specified endpoint, model or tool.

Install the official Linux Ollama archive under /srv/keyforcars-ollama/runtime and create the kfc-model service user. Install the service template and pull qwen3:4b with the service listening on 127.0.0.1:11434. After downloading the model, install a systemd drop-in with IPAddressDeny=any and IPAddressAllow=localhost. Do not publish this port through nginx or the firewall.

Model inference is enabled in local development and the isolated VPS demo. Other KeyForCars installations can opt in with KFC_LOCAL_MODEL=1 when local Ollama is present. The Windows development copy can use a local Ollama instance or a loopback-only SSH forward to this VPS.

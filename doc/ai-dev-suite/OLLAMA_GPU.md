# Ollama GPU – Use GPU, Not CPU-Only

Ollama runs models on CPU by default when no GPU support is available. To get GPU acceleration (NVIDIA, AMD, or Apple Metal), use the **official installer** and, on AMD Linux, add the ROCm package. Avoid distro packages (apt, snap) that may ship CPU-only builds.

---

## Official install (recommended)

Use the official script so Ollama can use GPU:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Then run a model, e.g. `ollama run llama3.1:latest`. If your GPU is detected, Ollama will use it.

---

## NVIDIA GPU

The official install includes CUDA support. You need:

- **Drivers:** NVIDIA driver 531+ (check with `nvidia-smi`)
- **CUDA:** Usually bundled with drivers; verify at [developer.nvidia.com/cuda-gpus](https://developer.nvidia.com/cuda-gpus)

If you already installed via the official script and have `nvidia-smi` working, Ollama should use the GPU. If it falls back to CPU:

1. Confirm `nvidia-smi` shows your GPU
2. Restart Ollama: `pkill ollama; ollama serve`
3. On Linux after suspend/resume, GPU can disappear — try: `sudo rmmod nvidia_uvm && sudo modprobe nvidia_uvm`

---

## AMD GPU (Linux)

On Linux with AMD Radeon, the base install is CPU-only. Add the ROCm package **after** the standard install:

```bash
# 1. Standard install
curl -fsSL https://ollama.com/install.sh | sh

# 2. AMD ROCm package (required for GPU)
curl -fsSL https://ollama.com/download/ollama-linux-amd64-rocm.tar.zst | sudo tar x -C /usr
```

Supported cards include RX 7900/7800/7700/7600/6900/6800 and Vega 64. See [docs.ollama.com/gpu](https://docs.ollama.com/gpu) for the full list.

---

## Verify GPU usage

- **Logs:** Run `ollama run llama3.1:latest`, then check output or `/tmp/ollama.log` for GPU-related messages.
- **Speed:** GPU runs are much faster than CPU; very slow responses suggest CPU-only.
- **Model:** Use `ollama run llama3.1:latest` or any model you prefer — the binary, not the model, determines CPU vs GPU.

---

## Avoid CPU-only installs

| Source | Risk |
|--------|------|
| `apt install ollama` | May be CPU-only or outdated |
| Snap / Flatpak | May lack GPU libs |
| **ollama.com/install.sh** | Correct path; includes GPU support when drivers present |

---

## See also

- [OLLAMA_TERMINAL.md](./OLLAMA_TERMINAL.md) – Start Ollama in a visible terminal
- [docs.ollama.com/linux](https://docs.ollama.com/linux) – Official Linux install
- [docs.ollama.com/gpu](https://docs.ollama.com/gpu) – Hardware support details

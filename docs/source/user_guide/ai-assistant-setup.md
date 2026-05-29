# AI Assistant Setup Guide

The AI Assistant is built on Jupyter AI and the Magic Wand extension, both included with Elyra. You only need to install and configure your preferred AI provider.

## Quick Start
#### 1. Install an AI provider 
```bash
pip install langchain-openai
```
#### 2. Set your API key
```bash
export OPENAI_API_KEY="sk-your-openai-key-here"
```

#### 3. Start Elyra
```bash
jupyter lab
```

#### 4. Configure Jupyter AI:
- Open the AI chat panel (💬)
- Select "openai-chat:gpt-4" as language model
- Test by sending a message in chat
- Look for the magic wand icon (🪄) in notebook cells


## AI Provider Setup

Choose and install the AI provider packages you want to use:

| Provider | Installation | Environment Variable |
|----------|-------------|---------------------|
| **OpenAI** | `pip install langchain-openai` | `OPENAI_API_KEY` |
| **Anthropic (Claude)** | `pip install langchain-anthropic` | `ANTHROPIC_API_KEY` |
| **Ollama (Local)** | `pip install langchain-ollama` | None |
| **Google Gemini** | `pip install langchain-google-genai` | `GOOGLE_API_KEY` |
| **All Providers** | `pip install "jupyter-ai[all]"` | Various |


### API Keys
Set your API keys as environment variables:
```bash
export OPENAI_API_KEY="sk-your-key-here"
export ANTHROPIC_API_KEY="sk-ant-your-key-here"
```


### Example Prompts
- "Create a function to calculate the mean of a list"
- "Add error handling to this code"
- "Convert this loop to use pandas"
- "Fix the syntax error in this cell"

## Troubleshooting

### Magic Wand Icon Missing/Disabled
- **Check**: Jupyter AI settings in chat panel
- **Verify**: API keys are set correctly
- **Install**: Required provider packages
- **Restart**: JupyterLab after changes

### Common Issues
- **Invalid API keys**: Verify keys are correct and active
- **Missing packages**: Install required AI provider packages
- **Ollama not running**: Start with `ollama serve`

## Security Notes

⚠️ **Important**: 
- Never commit API keys to version control
- Code may be sent to third-party AI services
- Consider local models (Ollama) for sensitive code

## Getting Help

- [Jupyter AI Documentation](https://jupyter-ai.readthedocs.io/)
- [GitHub Issues](https://github.com/elyra-ai/elyra/issues)
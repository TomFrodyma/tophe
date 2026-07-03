#!/bin/sh
# Tophe one-command installer.
#
#   curl -fsSL https://raw.githubusercontent.com/TomFrodyma/tophe/main/install.sh | sh
#
# or, from a downloaded copy of the code:
#
#   ./install.sh
#
# Safe to run again any time: it keeps your data and settings, rebuilds the
# app, and restarts it (that's also how you update).

set -e

REPO="${TOPHE_REPO:-TomFrodyma/tophe}"
APP_PORT="${APP_PORT:-3000}"

bold() { printf '\033[1m%s\033[0m\n' "$1"; }
say() { printf '%s\n' "$1"; }
ok() { printf '\033[32m✓\033[0m %s\n' "$1"; }
fail() { printf '\033[31m✗\033[0m %s\n' "$1"; }

# Ask on the terminal even when this script is piped into sh. With no usable
# terminal (automation), take the safe default.
ask() {
	REPLY="$2"
	if { true </dev/tty; } 2>/dev/null; then
		printf '%s' "$1" >/dev/tty
		IFS= read -r REPLY </dev/tty || REPLY="$2"
	fi
}

say ""
bold "  Tophe - your personal life dashboard"
say "  This sets everything up for you. It takes a few minutes, mostly waiting."
say ""

# ----- 1. Docker ------------------------------------------------------------

if ! command -v docker >/dev/null 2>&1; then
	fail "Docker isn't installed. Tophe runs inside Docker so it can't break anything on your computer."
	say ""
	case "$(uname -s)" in
	Darwin) say "  Install Docker Desktop (free): https://www.docker.com/products/docker-desktop/" ;;
	Linux) say "  Install Docker: https://docs.docker.com/engine/install/" ;;
	*) say "  Install Docker Desktop (free): https://www.docker.com/products/docker-desktop/" ;;
	esac
	say "  Then run this installer again."
	exit 1
fi

if ! docker info >/dev/null 2>&1; then
	fail "Docker is installed but not running. Open the Docker Desktop app, wait for it to say 'running', then run this again."
	exit 1
fi
ok "Docker is ready"

# ----- 2. Get the code (when run via curl | sh) ------------------------------

if [ ! -f docker-compose.yml ] || ! grep -q "tophe" docker-compose.yml 2>/dev/null; then
	say "Downloading Tophe..."
	mkdir -p tophe
	curl -fsSL "https://codeload.github.com/$REPO/tar.gz/refs/heads/main" | tar -xz -C tophe --strip-components=1
	cd tophe
	ok "Downloaded to ./tophe"
fi

# ----- 3. Settings & secrets -------------------------------------------------

gen_secret() {
	if command -v openssl >/dev/null 2>&1; then
		openssl rand -base64 32
	else
		head -c 32 /dev/urandom | base64
	fi
}

ensure_env() {
	# add "KEY=value" to .env only if KEY isn't set yet
	if ! grep -q "^$1=" .env 2>/dev/null; then
		printf '%s=%s\n' "$1" "$2" >>.env
	fi
}

touch .env
ensure_env BETTER_AUTH_SECRET "\"$(gen_secret)\""
ensure_env CALENDAR_INTEGRATION_SECRET "\"$(gen_secret)\""
ensure_env CRON_SECRET "\"$(gen_secret)\""
ok "Security keys generated (stored in .env - no action needed)"

# ----- 4. One question: where should the AI run? -----------------------------

if ! grep -q "^LOCAL_AI_BASE_URL=\|^ANTHROPIC_API_KEY=\|^OPENAI_API_KEY=" .env 2>/dev/null; then
	say ""
	bold "One question: where should Tophe's AI assistant run?"
	say ""
	say "  The AI is the heart of Tophe: the assistant, the daily briefing, the"
	say "  morning greeting. Pick where it runs:"
	say ""
	say "  1) On this computer (private - your data never leaves your machine."
	say "     Needs the free Ollama app and a reasonably strong computer.)"
	say "  2) In the cloud via Claude (best quality - needs an API key,"
	say "     paid per use, your data goes to Anthropic.)"
	say "  3) In the cloud via OpenAI or another provider (needs an API key;"
	say "     works with OpenAI, OpenRouter, Groq, Mistral - anything speaking"
	say "     the standard chat API.)"
	say "  4) Decide later (the app runs, but the assistant, briefing and"
	say "     greeting stay off until you re-run this installer or add a key"
	say "     to the .env file.)"
	say ""
	ask "Type 1, 2, 3 or 4 and press Enter [1]: " "4"
	choice="${REPLY:-1}"

	case "$choice" in
	1)
		if curl -fsS -m 2 http://localhost:11434/v1/models >/dev/null 2>&1; then
			ensure_env LOCAL_AI_BASE_URL "\"http://host.docker.internal:11434/v1\""
			ok "Found Ollama running - Tophe will use your local models"
		else
			say ""
			say "  Ollama isn't running yet. Two small steps:"
			say "    1. Install it from https://ollama.com (free)"
			say "    2. In a terminal, run:  ollama pull qwen2.5:14b"
			say "       (on a machine with 32 GB+ memory, qwen2.5:32b is nicer)"
			say ""
			say "  Setting it up anyway - Tophe will find the models once Ollama runs."
			ensure_env LOCAL_AI_BASE_URL "\"http://host.docker.internal:11434/v1\""
		fi
		;;
	2)
		say ""
		say "  Get a key at https://console.anthropic.com (Settings -> API keys)."
		ask "  Paste your API key (starts with sk-ant-): " ""
		if [ -n "$REPLY" ]; then
			ensure_env ANTHROPIC_API_KEY "\"$REPLY\""
			ok "Claude connected"
		else
			say "  No key entered - you can add it later in the .env file."
		fi
		;;
	3)
		say ""
		say "  Any OpenAI-compatible provider works. Get a key from your provider"
		say "  (for OpenAI: https://platform.openai.com -> API keys)."
		ask "  Paste your API key: " ""
		if [ -n "$REPLY" ]; then
			ensure_env OPENAI_API_KEY "\"$REPLY\""
			ask "  Using OpenAI itself? Press Enter. Otherwise paste the provider's base URL (e.g. https://openrouter.ai/api/v1): " ""
			if [ -n "$REPLY" ]; then
				ensure_env OPENAI_BASE_URL "\"$REPLY\""
			fi
			ok "Hosted AI connected"
		else
			say "  No key entered - you can add it later in the .env file."
		fi
		;;
	*)
		say "  Skipping AI for now. To set it up later: re-run ./install.sh, or add"
		say "  ANTHROPIC_API_KEY, OPENAI_API_KEY, or LOCAL_AI_BASE_URL to the .env file."
		;;
	esac
fi

# ----- 4b. Optional: email ---------------------------------------------------

if ! grep -q "^RESEND_API_KEY=\|^SKIP_EMAIL=" .env 2>/dev/null; then
	say ""
	bold "Want notifications by email too?"
	say "  Tophe always shows notifications in the app and in your browser."
	say "  For email on top, it uses Resend (free for personal use):"
	say "  create a key at https://resend.com -> API Keys."
	say ""
	ask "Paste a Resend API key, or just press Enter to skip: " ""
	if [ -n "$REPLY" ]; then
		ensure_env RESEND_API_KEY "\"$REPLY\""
		ok "Email notifications on"
	else
		ensure_env SKIP_EMAIL "1"
		say "  Skipped. Add a RESEND_API_KEY to .env later if you change your mind."
	fi
fi

# ----- 5. Build & start ------------------------------------------------------

say ""
bold "Building and starting Tophe..."
say "The first time takes 5-10 minutes (it's building the whole app). After that it's seconds."
say ""
docker compose up -d --build

printf 'Waiting for Tophe to come online'
i=0
until curl -fsS -m 2 "http://localhost:$APP_PORT/api/health" >/dev/null 2>&1; do
	i=$((i + 1))
	if [ "$i" -ge 90 ]; then
		say ""
		fail "Tophe didn't come online. See what happened with: docker compose logs app"
		exit 1
	fi
	printf '.'
	sleep 2
done
say ""

# ----- 6. Done ---------------------------------------------------------------

URL="http://localhost:$APP_PORT"
say ""
bold "  Tophe is running!"
say ""
say "  Open $URL in your browser."
say "  It will ask you to create your account - and that's it."
say ""
say "  Useful later:"
say "    stop:    docker compose down        (your data is kept)"
say "    start:   docker compose up -d"
say "    update:  ./install.sh"
say ""

case "$(uname -s)" in
Darwin) open "$URL" >/dev/null 2>&1 || true ;;
Linux) xdg-open "$URL" >/dev/null 2>&1 || true ;;
esac

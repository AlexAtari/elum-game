const DEFAULT_MULTIPLAYER_PORT = 8787

type BrowserLocation = Pick<
  Location,
  'protocol' | 'hostname'
>

export function createDefaultMultiplayerServerUrl(
  location: BrowserLocation,
) {
  const protocol =
    location.protocol === 'https:' ? 'wss:' : 'ws:'

  return `${protocol}//${location.hostname}:${DEFAULT_MULTIPLAYER_PORT}`
}

export function buildMultiplayerWebSocketUrl(
  serverUrl: string,
  lobbyId: string,
) {
  const url = new URL(serverUrl.trim())

  if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
    throw new Error('WebSocket URL required.')
  }

  const normalizedLobbyId = lobbyId.trim()

  if (
    normalizedLobbyId.length === 0 ||
    normalizedLobbyId.length > 128
  ) {
    throw new Error('Invalid lobby id.')
  }

  url.pathname = '/multiplayer'
  url.search = ''
  url.hash = ''
  url.searchParams.set('lobby', normalizedLobbyId)
  return url.toString()
}

const DEFAULT_MULTIPLAYER_PORT = 8787
const MULTIPLAYER_INVITE_FLAG = 'multiplayer'
const MULTIPLAYER_INVITE_SERVER = 'server'
const MULTIPLAYER_INVITE_LOBBY = 'lobby'

type BrowserLocation = Pick<
  Location,
  'protocol' | 'hostname'
>

export type MultiplayerInvite = {
  serverUrl: string
  lobbyId: string
}

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

export function createMultiplayerInviteUrl(
  pageUrl: string,
  serverUrl: string,
  lobbyId: string,
) {
  const endpoint = new URL(
    buildMultiplayerWebSocketUrl(serverUrl, lobbyId),
  )
  const inviteUrl = new URL(pageUrl)

  inviteUrl.hash = ''
  inviteUrl.searchParams.set(MULTIPLAYER_INVITE_FLAG, '1')
  inviteUrl.searchParams.set(
    MULTIPLAYER_INVITE_SERVER,
    endpoint.origin,
  )
  inviteUrl.searchParams.set(
    MULTIPLAYER_INVITE_LOBBY,
    endpoint.searchParams.get('lobby') ?? '',
  )
  return inviteUrl.toString()
}

export function readMultiplayerInvite(
  search: string,
): MultiplayerInvite | null {
  const parameters = new URLSearchParams(search)

  if (parameters.get(MULTIPLAYER_INVITE_FLAG) !== '1') {
    return null
  }

  const serverUrl = parameters.get(MULTIPLAYER_INVITE_SERVER)
  const lobbyId = parameters.get(MULTIPLAYER_INVITE_LOBBY)

  if (serverUrl === null || lobbyId === null) {
    return null
  }

  try {
    const endpoint = new URL(
      buildMultiplayerWebSocketUrl(serverUrl, lobbyId),
    )

    return {
      serverUrl: endpoint.origin,
      lobbyId: endpoint.searchParams.get('lobby') ?? '',
    }
  } catch {
    return null
  }
}

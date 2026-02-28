export function detectDeviceFromUserAgent(userAgent: string): string | null {

  if (!userAgent) return null;

  const agent = userAgent.toLowerCase();

  if (agent.includes('android')) return 'ANDROID';
  if (agent.includes('iphone') || agent.includes('ipad')) return 'IOS';

  if (agent.includes('windows')) return 'WINDOWS';
  if (agent.includes('macintosh') || agent.includes('mac os')) return 'MAC';
  if (agent.includes('linux')) return 'LINUX';

  return null;
}
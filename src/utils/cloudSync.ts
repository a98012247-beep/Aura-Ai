import { serverTimestamp } from 'firebase/firestore';

export function prepareCloudSyncPayload(settingsState: any, projectsState: any) {
  const sanitizedProjects = (projectsState?.projects || []).map((p: any) => {
    // If audioUrl is a base64 string or long data URL, omit it from cloud sync
    // so Firestore documents stay small (<1MB limit). Full audio remains stored in IndexedDB.
    const isBase64Audio = typeof p.audioUrl === 'string' && (p.audioUrl.startsWith('data:') || p.audioUrl.length > 500);
    return {
      ...p,
      audioUrl: isBase64Audio ? '' : (p.audioUrl || ''),
    };
  });

  const plainData = JSON.parse(JSON.stringify({
    settings: {
      apiKeys: settingsState?.apiKeys || [],
      voiceSettings: settingsState?.voiceSettings,
      cinematicSettings: settingsState?.cinematicSettings,
      voiceProfiles: settingsState?.voiceProfiles || [],
      activeProfileId: settingsState?.activeProfileId,
    },
    projects: {
      projects: sanitizedProjects,
    },
  }));

  let jsonString = JSON.stringify(plainData);
  if (jsonString.length > 800000) {
    // Safety fallback: limit to 10 most recent projects if data is somehow still large
    plainData.projects.projects = plainData.projects.projects.slice(0, 10);
  }

  return {
    ...plainData,
    updatedAt: serverTimestamp(),
  };
}

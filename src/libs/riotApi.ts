import fetch from 'node-fetch';
import { RiotResponse } from '@libs/types/riotResponse';
import { Region, regions } from '@libs/types/region';

export const fetchSummoner = async (
  name: string,
  region: Region,
  token: string
): Promise<RiotResponse> => {
  const res = await fetch(
    `https://${regions[region]}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`,
    {
      headers: {
        'X-Riot-Token': token
      }
    }
  );

  const response: RiotResponse = (await res.json()) as RiotResponse;

  if (response.status?.message) {
    throw new Error(response.status.message);
  }

  return response;
};

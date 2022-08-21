import fetch, { Response } from 'node-fetch';
import { RiotResponse } from '@libs/types/riotResponse';
import { URL } from 'url';
import { regions } from '@libs/types/region';

const parseResponse = (res: Response): Promise<RiotResponse> => {
  return new Promise((resolve, reject) => {
    res
      .json()
      .then((response: RiotResponse) => {
        if (response.status?.message) {
          reject(response.status.message);
        } else {
          resolve(response);
        }
      })
      .catch((e) => reject(e));
  });
};

export const fetchSummoner = (
  name: string,
  region: string,
  token: string,
): Promise<RiotResponse> => {
  const url = new URL(
    `https://${regions[region]}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`,
  );
  return fetch(url.toString(), {
    headers: {
      'X-Riot-Token': token,
    },
  }).then((res) => parseResponse(res));
};

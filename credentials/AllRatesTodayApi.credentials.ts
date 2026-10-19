import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AllRatesTodayApi implements ICredentialType {
	name = 'allRatesTodayApi';

	displayName = 'AllRatesToday API';

	documentationUrl = 'https://allratestoday.com/docs/';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Your AllRatesToday API key (starts with art_live_). Register free at https://allratestoday.com/register — 300 free requests, no card. Official central-bank rates work without a key.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://allratestoday.com',
			url: '/api/v1/rates',
			method: 'GET',
			qs: {
				source: 'USD',
				target: 'EUR',
			},
		},
	};
}

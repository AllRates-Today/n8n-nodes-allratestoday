import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://allratestoday.com';

/** GET /api/open/central-banks */
interface CentralBankSource {
	code: string;
	name: string;
	latest: string;
	age_days: number;
	stale: boolean;
	cadence: string;
}

/** GET /api/open/central-bank/{bank} */
interface OfficialTable {
	bank: string;
	rate_date: string;
	age_days: number;
	stale: boolean;
	cadence: string;
	rates: Array<{ base: string; quote: string; type: string; value: number }>;
}

/** GET /api/v1/rates?source=&target= */
interface MarketRate {
	rate: number;
	source: string;
	target: string;
	time: string;
}

export class AllRatesToday implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AllRatesToday',
		name: 'allRatesToday',
		icon: 'file:allratestoday.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Official central-bank exchange rates (keyless) and real-time market rates from AllRatesToday',
		defaults: {
			name: 'AllRatesToday',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'allRatesTodayApi',
				required: true,
				displayOptions: {
					show: {
						resource: ['marketRate'],
					},
				},
			},
		],
		requestDefaults: {
			baseURL: BASE_URL,
			headers: {
				Accept: 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Market Rate',
						value: 'marketRate',
						description: 'Real-time mid-market rates and conversion (API key required)',
					},
					{
						name: 'Official Rate',
						value: 'officialRate',
						description: 'Rates published by a central bank or tax authority (no API key needed)',
					},
				],
				default: 'officialRate',
			},

			// ----------------------------------
			//         officialRate
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['officialRate'],
					},
				},
				options: [
					{
						name: 'Get Pair',
						value: 'getPair',
						description: 'Get the official rate for one currency pair',
						action: 'Get an official rate for a currency pair',
					},
					{
						name: 'Get Table',
						value: 'getTable',
						description: 'Get the full latest table published by the bank',
						action: 'Get the full official rate table',
					},
				],
				default: 'getPair',
			},
			{
				displayName: 'Bank Name or ID',
				name: 'bank',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getCentralBanks',
				},
				displayOptions: {
					show: {
						resource: ['officialRate'],
					},
				},
				default: 'ecb',
				required: true,
				description:
					'Central bank or tax authority whose published rates to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Source Currency',
				name: 'source',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['officialRate'],
						operation: ['getPair'],
					},
				},
				default: 'USD',
				required: true,
				placeholder: 'USD',
				description: 'ISO 4217 code of the currency to convert from',
			},
			{
				displayName: 'Target Currency',
				name: 'target',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['officialRate'],
						operation: ['getPair'],
					},
				},
				default: 'EUR',
				required: true,
				placeholder: 'EUR',
				description: 'ISO 4217 code of the currency to convert to',
			},
			{
				displayName: 'Split Into Items',
				name: 'splitRows',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['officialRate'],
						operation: ['getTable'],
					},
				},
				default: true,
				description:
					'Whether to output one item per published rate (with bank and rate_date on each) instead of a single item holding the whole table',
			},

			// ----------------------------------
			//         marketRate
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['marketRate'],
					},
				},
				options: [
					{
						name: 'Convert',
						value: 'convert',
						description: 'Convert an amount between two currencies at the live rate',
						action: 'Convert an amount at the live market rate',
					},
					{
						name: 'Get Rates',
						value: 'getRates',
						description: 'Get live rates from a source currency to one, several or all currencies',
						action: 'Get live market rates',
					},
				],
				default: 'getRates',
			},
			{
				displayName: 'Source Currency',
				name: 'source',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['marketRate'],
					},
				},
				default: 'USD',
				required: true,
				placeholder: 'USD',
				description: 'ISO 4217 code of the currency to convert from',
			},
			{
				displayName: 'Target Currencies',
				name: 'targets',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['marketRate'],
						operation: ['getRates'],
					},
				},
				default: '',
				placeholder: 'EUR,GBP,JPY',
				description:
					'Comma-separated ISO 4217 codes. Leave empty to get rates to every supported currency.',
			},
			{
				displayName: 'Target Currency',
				name: 'target',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['marketRate'],
						operation: ['convert'],
					},
				},
				default: 'EUR',
				required: true,
				placeholder: 'EUR',
				description: 'ISO 4217 code of the currency to convert to',
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				typeOptions: {
					minValue: 0,
				},
				displayOptions: {
					show: {
						resource: ['marketRate'],
						operation: ['convert'],
					},
				},
				default: 100,
				required: true,
				description: 'Amount in the source currency to convert',
			},
			{
				displayName: 'Split Into Items',
				name: 'splitRows',
				type: 'boolean',
				displayOptions: {
					show: {
						resource: ['marketRate'],
						operation: ['getRates'],
					},
				},
				default: true,
				description:
					'Whether to output one item per rate instead of a single item holding the whole array',
			},
		],
	};

	methods = {
		loadOptions: {
			async getCentralBanks(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = (await this.helpers.httpRequest({
					method: 'GET',
					url: `${BASE_URL}/api/open/central-banks`,
					json: true,
				})) as { sources?: CentralBankSource[] };

				const sources = response.sources ?? [];
				return sources
					.map((s) => ({
						name: `${s.name} (${s.code.toUpperCase()})`,
						value: s.code,
						description: `Latest table: ${s.latest}, ${s.cadence}`,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const pushJson = (json: IDataObject) => {
					returnData.push({ json, pairedItem: { item: i } });
				};

				if (resource === 'officialRate') {
					const bank = (this.getNodeParameter('bank', i) as string).trim().toLowerCase();
					if (!bank) {
						throw new NodeOperationError(this.getNode(), 'Bank is required', { itemIndex: i });
					}

					if (operation === 'getPair') {
						const source = currencyCode.call(this, 'source', i);
						const target = currencyCode.call(this, 'target', i);
						const data = await openRequest.call(this, `/api/open/central-bank/${bank}`, {
							source,
							target,
						});
						pushJson(data);
					} else if (operation === 'getTable') {
						const splitRows = this.getNodeParameter('splitRows', i) as boolean;
						const table = (await openRequest.call(
							this,
							`/api/open/central-bank/${bank}`,
						)) as unknown as OfficialTable;

						if (splitRows && Array.isArray(table.rates)) {
							for (const row of table.rates) {
								pushJson({
									bank: table.bank,
									rate_date: table.rate_date,
									base: row.base,
									quote: row.quote,
									type: row.type,
									value: row.value,
									age_days: table.age_days,
									stale: table.stale,
								});
							}
						} else {
							pushJson(table as unknown as IDataObject);
						}
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for official rates`,
							{ itemIndex: i },
						);
					}
				} else if (resource === 'marketRate') {
					const source = currencyCode.call(this, 'source', i);

					if (operation === 'getRates') {
						const targetsRaw = this.getNodeParameter('targets', i, '') as string;
						const splitRows = this.getNodeParameter('splitRows', i) as boolean;
						const targets = targetsRaw
							.split(',')
							.map((t) => t.trim().toUpperCase())
							.filter((t) => t.length > 0)
							.join(',');

						const qs: IDataObject = { source };
						if (targets) qs.target = targets;

						const rates = (await authedRequest.call(
							this,
							'/api/v1/rates',
							qs,
						)) as unknown as MarketRate[];

						if (splitRows && Array.isArray(rates)) {
							for (const r of rates) pushJson(r as unknown as IDataObject);
						} else {
							pushJson({ source, rates } as IDataObject);
						}
					} else if (operation === 'convert') {
						const target = currencyCode.call(this, 'target', i);
						const amount = this.getNodeParameter('amount', i) as number;
						if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
							throw new NodeOperationError(this.getNode(), 'Amount must be a non-negative number', {
								itemIndex: i,
							});
						}
						const data = await authedRequest.call(this, '/api/v1/rates', {
							source,
							target,
							amount,
						});
						pushJson(data);
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`The operation "${operation}" is not supported for market rates`,
							{ itemIndex: i },
						);
					}
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not supported`,
						{ itemIndex: i },
					);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}

function currencyCode(this: IExecuteFunctions, name: string, itemIndex: number): string {
	const raw = (this.getNodeParameter(name, itemIndex) as string) ?? '';
	const code = raw.trim().toUpperCase();
	if (!/^[A-Z0-9]{3}$/.test(code)) {
		throw new NodeOperationError(
			this.getNode(),
			`"${raw}" is not a valid 3-letter ISO 4217 currency code`,
			{ itemIndex },
		);
	}
	return code;
}

/** Keyless request against /api/open/... */
async function openRequest(
	this: IExecuteFunctions,
	path: string,
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}${path}`,
		qs,
		headers: { Accept: 'application/json' },
		json: true,
	};
	try {
		return (await this.helpers.httpRequest(options)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as never);
	}
}

/** Authenticated request against /api/v1/... using the allRatesTodayApi credential */
async function authedRequest(
	this: IExecuteFunctions,
	path: string,
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}${path}`,
		qs,
		headers: { Accept: 'application/json' },
		json: true,
	};
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'allRatesTodayApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as never);
	}
}

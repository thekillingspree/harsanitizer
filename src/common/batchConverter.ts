import { InspectorEntry } from "../components/TraceInspector/TraceInspector";
import { UberBatchRequest, UberBatchResponse } from "../sanitizer/models/batchRequest";
import { Entry, NameValueKeyPair } from "../sanitizer/models/harFile";
import { isBatchRequest } from "../sanitizer/requestRules/armBatchResponseRule";

const convertBatchHeadersToHeaders = (batchHeaders: { [id: string]: string }) => {
    const headers: NameValueKeyPair[] = [];
    for (const key of Object.keys(batchHeaders)) {
        headers.push({
            name: key,
            value: batchHeaders[key]
        });
    }

    return headers;
}

export const convertBatchEntryToEntries = (entry: Entry, entries: InspectorEntry[], searchTerm: string) => {
    if (isBatchRequest(entry.request) && entry.request.postData) {
        const uberBatchRequest: UberBatchRequest = JSON.parse(entry.request?.postData.text);
        const uberBatchResponse: UberBatchResponse = JSON.parse(entry.response.content.text);

        for (let i = 0; i < uberBatchRequest.requests.length; i++) {
            const batchRequest = uberBatchRequest.requests[i];
            const batchResponse = uberBatchResponse.responses[i];
            let url = batchRequest.url;
            if (!searchTerm || url.toLowerCase().indexOf(searchTerm.toLowerCase()) > -1) {

                // Batch request URLs are inconsitent and may sometimes just be relative paths
                if (!url.startsWith('http')) {
                    const parsed = new URL(entry.request.url);
                    url = `${parsed.protocol}//${parsed.hostname}${url}`;
                }

                const newEntry: InspectorEntry = {
                    request: {
                        method: batchRequest.httpMethod,
                        url: url,
                        headers: convertBatchHeadersToHeaders(batchRequest.requestHeaderDetails),
                        queryString: [],
                        cookies: [],
                        postData: {
                            mimeType: 'application/json',
                            text: JSON.stringify(batchRequest.content)
                        }
                    },
                    response: {
                        status: batchResponse.httpStatusCode,
                        statusText: '',
                        headers: convertBatchHeadersToHeaders(batchResponse.headers),
                        cookies: [],
                        content: {
                            mimeType: 'application/json',
                            text: JSON.stringify(batchResponse.content)
                        },
                        _transferSize: batchResponse.contentLength
                    },
                    time: 0,
                    isBatchChildEntry: true
                }

                entries.push(newEntry);
            }

        }
    }
}
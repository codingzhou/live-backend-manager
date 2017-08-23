import {
    GET_LIST,
    GET_ONE,
    GET_MANY,
    GET_MANY_REFERENCE,
    CREATE,
    UPDATE,
    DELETE,
    fetchUtils,
} from 'admin-on-rest';

// const API_URL = 'http://localhost:2333';

/**
 * @param {string} type Request type, e.g GET_LIST
 * @param {string} resource Resource name, e.g. "posts"
 * @param {Object} payload Request parameters. Depends on the request type
 * @returns {Promise} the Promise for a REST response
 */
export default (API_URL) => {
    /**
 * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
 * @param {String} resource Name of the resource to fetch, e.g. 'posts'
 * @param {Object} params The REST request params, depending on the type
 * @returns {Object} { url, options } The HTTP request parameters
 */
    const convertRESTRequestToHTTP = (type, resource, params) => {
        let url = '';
        const { queryParameters } = fetchUtils;
        const options = {};
        switch (type) {
            case GET_LIST: {
                const { page, perPage } = params.pagination;
                const { field, order } = params.sort;
                const query = {
                    ...params.filter,
                    _sort: field,
                    _order: order,
                    _start: (page - 1) * perPage,
                    _end: page * perPage,
                };
                url = `${API_URL}/${resource}?${queryParameters(query)}`;
                break;
            }
            case GET_ONE:
                url = `${API_URL}/${resource}/${params.id}`;
                break;
            case GET_MANY_REFERENCE: {
                const { page, perPage } = params.pagination;
                const { field, order } = params.sort;
                const query = {
                    ...params.filter,
                    [params.target]: params.id,
                    _sort: field,
                    _order: order,
                    _start: (page - 1) * perPage,
                    _end: page * perPage,
                };
                url = `${API_URL}/${resource}?${queryParameters(query)}`;
                break;
            }
            case UPDATE:
                url = `${API_URL}/${resource}/${params.id}`;
                options.method = 'PUT';
                options.body = JSON.stringify(params.data);
                break;
            case CREATE:
                url = `${API_URL}/${resource}`;
                options.method = 'POST';
                options.body = JSON.stringify(params.data);
                break;
            case DELETE:
                url = `${API_URL}/${resource}/${params.id}`;
                options.method = 'DELETE';
                break;
            default:
                throw new Error(`Unsupported fetch action type ${type}`);
        }
        return { url, options };
    };

    /**
     * @param {Object} response HTTP response from fetch()
     * @param {String} type One of the constants appearing at the top if this file, e.g. 'UPDATE'
     * @param {String} resource Name of the resource to fetch, e.g. 'posts'
     * @param {Object} params The REST request params, depending on the type
     * @returns {Object} REST response
     */
    const convertHTTPResponseToREST = (response, type, resource, params) => {
        const { headers, json } = response;
        switch (type) {
        case GET_LIST:
        case GET_MANY_REFERENCE:
            //这里，json-server 有个参数是no-cors，默认是允许跨域的，有个值Access-Control-Allow-Origin:http://localhost:3000
            //不确定这个是自动监测的，还是json-server自动设置的，刚好和我的项目端口是一样的
            if (!headers.has('x-total-count')) {
                throw new Error('The X-Total-Count header is missing in the HTTP Response. The jsonServer REST client expects responses for lists of resources to contain this header with the total number of results to build the pagination. If you are using CORS, did you declare X-Total-Count in the Access-Control-Expose-Headers header?');
            }
            return {
                data: json,
                total: parseInt(headers.get('x-total-count').split('/').pop(), 10),
            };
        case CREATE:
            return { data: { ...params.data, id: json.id } };
        default:
            return { data: json };
        }
    };
    return (type, resource, params) => {
        const { fetchJson } = fetchUtils;
        if (type === GET_MANY) {
            return Promise.all(params.ids.map(id => fetchJson(`${API_URL}/${resource}/${id}`)))
                .then(responses => ({ data: responses.map(response => response.json) }));
        }
        const { url, options } = convertRESTRequestToHTTP(type, resource, params);
        return fetchJson(url, options)
            .then(response => convertHTTPResponseToREST(response, type, resource, params));
    };
};
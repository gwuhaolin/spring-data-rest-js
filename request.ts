export interface SpringRequestInit extends RequestInit {
    url?:string
}

function buildHttpMethodFunction(method:string) {

    /**
     * make http request user fetch API.
     * if path param is a complete url then fetch ues path as url,
     * else path is not a complete url string but just a path then fetch url=requestConfig.baseURL+path
     * url string will been auto revised, etc: http://localhost/api//user///id/ will convert to http://localhost/api/user/id
     * @param path url path
     */
    function httpRequest(path:string):Request {
        let url = path;
        if (!/^https?:\/\/.+$/g.test(path)) {//path is not a full url
            url = requestConfig.baseURL + '/' + path;
        }
        url = url.replace(/\/{2,}/g, '/').replace(/:\//g, '://');
        return new Request({url: url, method: method});
    }

    return httpRequest;
}

export class Request {

    /**
     * store fetch options
     */
    options:SpringRequestInit = {
        headers: {}
    };

    /**
     * has this request been send
     */
    hasSend:boolean = false;

    /**
     * The Response interface of the Fetch API represents the response to a request.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
     */
    response:Response = null;

    /**
     * if error happen during request error will store in there,else this will be null
     */
    error:any = null;

    /**
     * after request finish without error,response data will store in there,else will be null
     */
    responseData:any;

    /**
     * @param fetchOptions
     */
    constructor(fetchOptions:SpringRequestInit) {
        Object.assign(this.options, requestConfig.globalFetchOptions, fetchOptions);
    }

    /**
     * reset query param in request url by append ? and query param to end of url
     * @param obj
     */
    queryParam(obj:{[key:string]:any}):Request {
        if (obj != null) {
            let arr = [];
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    arr.push(`${key}=${obj[key]}`)
                }
            }
            this.options.url = this.options.url.split('?')[0] + '?' + arr.join('&');
        }
        return this;
    }

    /**
     * set request body use json
     * HTTP Header Content-Type will set as application/json
     * @param obj
     */
    jsonBody(obj:{[key:string]:any}):Request {
        this.options.body = JSON.stringify(obj);
        this.options.headers['Content-Type'] = 'application/json';
        return this;
    }

    /**
     * set request body as form type
     * parse obj to form string
     * HTTP Header Content-Type will set as application/x-www-form-urlencoded
     * @param obj
     */
    formBody(obj:{[key:string]:any}):Request {
        let arr = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                arr.push(`${key}=${obj[key]}`)
            }
        }
        this.options.body = arr.join('&');
        this.options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        return this;
    }

    /**
     * send fetch request
     * get response's data
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    send():Promise<{[key:string]:any}|string|void> {
        return new Promise((resolve, reject)=> {
            if (this.hasSend) {
                if (this.error == null) {
                    resolve(this.responseData);
                } else {
                    reject(this.error);
                }
            } else {
                this.hasSend = true;
                let {fetchStartHook, fetchEndHook} = requestConfig;
                fetchStartHook && fetchStartHook(this);
                fetch(this.options.url, this.options).then((response:Response)=> {
                    this.response = response;
                    let contentType = response.headers.get('content-type');
                    if (contentType == null) {
                        return Promise.resolve();
                    } else {
                        if (/.*json.*/.test(contentType)) {
                            //noinspection JSUnresolvedFunction
                            return response.json();
                        } else {
                            return response.text();
                        }
                    }
                }).then(data=> {
                    this.responseData = data;
                    if (this.response.ok) {
                        return Promise.resolve(data);
                    } else {
                        return Promise.reject(data);
                    }
                }).then((data:any)=> {
                    fetchEndHook && fetchEndHook(this);
                    resolve(data);
                }).catch(err=> {
                    this.error = err;
                    fetchEndHook && fetchEndHook(this);
                    reject(this);
                })
            }
        })
    }

    /**
     * send request follow _links's href
     * resolve:
     *      if response content-type is null,then resolve null
     *      if response content-type has string json,then read response data as json and resolve pure json
     *      else read response data as text and resolve plain text
     */
    follow(keys:string[]):Promise<{[key:string]:any}|string|void> {
        let self = this;
        return new Promise((resolve, reject) => {
            function doFollow(data) {
                let key = keys.shift();
                if (key) {
                    let links = data['_links'];
                    let url = links[key];
                    if (url != null) {
                        url = url['href'];
                        get(url).send().then(data => {
                            doFollow(data);
                        }).catch(self => {
                            reject(self);
                        })
                    } else {
                        self.error = `no key=${key} in links ${JSON.stringify(links, null, 4)}`;
                        reject(this);
                    }
                } else {
                    resolve(data);
                }
            }

            this.send().then(data=> {
                doFollow(data);
            }).catch(self=> {
                reject(self);
            })

        })
    }

}

export let requestConfig:{
    /**
     * options used to every fetch request
     */
    globalFetchOptions:RequestInit;
    /**
     * fetch request base url
     */
    baseURL:string;
    /**
     * call before send fetch request
     * default do nothing
     */
    fetchStartHook:(Request)=>void;
    /**
     * call after fetch request end
     * default do nothing
     */
    fetchEndHook:(Request)=>void;
} = {
    globalFetchOptions: {},
    baseURL: '/',
    fetchStartHook: null,
    fetchEndHook: null
};

/**
 * make http get request
 * @param path url path
 */
export const get = buildHttpMethodFunction('GET');

/**
 * make http post request
 * @param path url path
 */
export const post = buildHttpMethodFunction('POST');

/**
 * make http patch request
 * @param path url path
 */
export const patch = buildHttpMethodFunction('PATCH');

/**
 * make http put request
 * @param path url path
 */
export const put = buildHttpMethodFunction('PUT');

//noinspection ReservedWordAsName
/**
 * make http remove request
 * @param path url path
 */
export const deleteMethod = buildHttpMethodFunction('DELETE');

/**
 * mockRequest a request with data
 * @param {object} data
 */
export function mockRequest(data) {
    let url = data['_links']['self']['href'];
    let req = new Request({url, method: 'GET'});
    req.responseData = data;
    req.hasSend = true;
    return req;
}


import * as request from 'request'
import {Observable, Observer} from 'rxjs/Rx'

export class HttpClient {

    public get(url: string, options?: request.CoreOptions): Observable<request.RequestResponse> {
        return this.request(Object.assign({
            url: url,
            method: "GET",
        }, options || {}))
    }

    public post(url: string, options?: request.CoreOptions): Observable<request.RequestResponse> {
        return this.request(Object.assign({
            url: url,
            method: "POST",
        }, options || {}))
    }

    public put(url: string, options?: request.CoreOptions): Observable<request.RequestResponse> {
        return this.request(Object.assign({
            url: url,
            method: "PUT",
        }, options || {}))
    }

    public delete(url: string, options?: request.CoreOptions): Observable<request.RequestResponse> {
        return this.request(Object.assign({
            url: url,
            method: "DELETE",
        }, options || {}))
    }

    public request(options: request.UrlOptions & request.CoreOptions): Observable<request.RequestResponse> {
        // return Observable.bindNodeCallback(request)(Object.assign({json: true}, options))
        return Observable.create((observer: Observer<request.RequestResponse>) => {
            request(Object.assign({
                json: true
            }, options), (err, res, body) => {
                if(err)
                    observer.error(err)
                else {
                    observer.next(res)
                    observer.complete()
                }
            })
        })
    }
}

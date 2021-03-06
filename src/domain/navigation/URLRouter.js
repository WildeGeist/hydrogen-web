/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export class URLRouter {
    constructor({history, navigation, parseUrlPath, stringifyPath}) {
        this._history = history;
        this._navigation = navigation;
        this._parseUrlPath = parseUrlPath;
        this._stringifyPath = stringifyPath;
        this._subscription = null;
        this._pathSubscription = null;
    }

    attach() {
        this._subscription = this._history.subscribe(url => {
            const redirectedUrl = this._applyUrl(url);
            if (redirectedUrl !== url) {
                this._history.replaceUrlSilently(redirectedUrl);
            }
        });
        this._applyUrl(this._history.get());
        this._pathSubscription = this._navigation.pathObservable.subscribe(path => {
            const url = this.urlForPath(path);
            if (url !== this._history.get()) {
                this._history.pushUrlSilently(url);
            }
        });
    }

    dispose() {
        this._subscription = this._subscription();
        this._pathSubscription = this._pathSubscription();
    }

    _applyUrl(url) {    
        const urlPath = this._history.urlAsPath(url)
        const navPath = this._navigation.pathFrom(this._parseUrlPath(urlPath, this._navigation.path));
        this._navigation.applyPath(navPath);
        return this._history.pathAsUrl(this._stringifyPath(navPath));
    }

    pushUrl(url) {
        this._history.pushUrl(url);
    }

    getLastUrl() {
        return this._history.getLastUrl();
    }

    urlForSegments(segments) {
        let path = this._navigation.path;
        for (const segment of segments) {
            path = path.with(segment);
            if (!path) {
                return;
            }
        }
        return this.urlForPath(path);
    }

    urlForSegment(type, value) {
        return this.urlForSegments([this._navigation.segment(type, value)]);
    }

    urlUntilSegment(type) {
        return this.urlForPath(this._navigation.path.until(type));
    }

    urlForPath(path) {
        return this._history.pathAsUrl(this._stringifyPath(path));
    }

    openRoomActionUrl(roomId) {
        // not a segment to navigation knowns about, so append it manually
        const urlPath = `${this._stringifyPath(this._navigation.path.until("session"))}/open-room/${roomId}`;
        return this._history.pathAsUrl(urlPath);
    }
}

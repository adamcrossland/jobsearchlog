(function () {
    const appName = "JobSearchLog";
    // const contentToCache = [
    //     'jobsearchlogapp',
    //     'jobsearchlogapp/main.js',
    //     'jobsearchlogapp/styles.css',
    //     'jobsearchlogapp/install.js',
    //     'jobsearchlogapp/jsl_192x192.png',
    //     'jobsearchlogapp/jsl_512x512.png',
    //     'jobsearchlogapp/site.webmanifest',
    //     'jobsearchlogapp/manifest.json'
    // ];

    const contentToCache = [
        '',
        '/main.js',
        '/styles.css',
        '/install.js',
        '/jsl_192x192.png',
        '/jsl_512x512.png',
        '/site.webmanifest',
        '/manifest.json'
    ];

    console.log("In install.js");

    // self.addEventListener("install", (e) => {
    //     e.waitUntil(
    //         (async () => {
    //             const cache = await caches.open(appName);
    //             //await cache.addAll(contentToCache);
    //             contentToCache.map(content => {
    //                 return cache.add(content).catch(err => {
    //                     console.error(`Failed to cache ${content}: ${err}`);
    //                 });
    //             });
    //         })(),
    //     );
    // });
       
    self.addEventListener("install", event => {
        console.log('In install event handler');
        event.waitUntil(
            caches.open(appName).then(cache => {
                return Promise.all(
                    contentToCache.map(asset => {
                        const assetPath = `https://jobsearchlog.com/${asset}`;
                        return cache.add(assetPath)
                            .then(() => console.log(`Successfully cached ${assetPath}`))
                            .catch(err => {
                            console.error(`Failed to cache ${assetPath}:`, err);
                        });
                    })
                );
            })
        );
    });
    
    // self.addEventListener( "activate", event => {
    //     ;
    // });

    self.addEventListener('activate', event => {
        console.log('Service worker activated');
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== appName) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        );
    });
    
    self.addEventListener('fetch', function (event) {
        event.respondWith(
            caches.match(event.request).then(function(response) {
                return response || fetch(event.request);
            })
        );
    });
})();

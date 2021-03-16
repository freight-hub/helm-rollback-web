class HttpRollbackApi1 {
    constructor(endpoint){
        this.endpoint = endpoint;
    }
    async fetch(path, req) {
        return fetch(new URL(path, this.endpoint).toString(), req);
    }
    async fetchJson(path, req) {
        return await this.fetch(path, req).then((x)=>x.json()
        );
    }
    async getLoginStatus() {
        return await this.fetchJson(`login-status`);
    }
    async getReleaseList() {
        return await this.fetchJson(`helm-list`);
    }
    async getReleaseHistory(namespace, releaseName) {
        return await this.fetchJson(`helm-history/${namespace}/${releaseName}`);
    }
    async performRollback(namespace, releaseName, targetRevision) {
        const resp = await this.fetch(`dorollback/${namespace}/${releaseName}/${targetRevision}`);
        return await resp.text();
    }
}
export { HttpRollbackApi1 as HttpRollbackApi };
class MockRollbackApi1 {
    async getLoginStatus() {
        return {
            email: "mock-demo-user@forto.com",
            isMock: true
        };
    }
    async getReleaseList() {
        return [
            {
                "name": "booking-core",
                "namespace": "yarrrnicorns",
                "revision": "8",
                "updated": "2021-03-03 15:21:34.343751141 +0000 UTC",
                "status": "deployed",
                "chart": "booking-core-0.1.0",
                "app_version": "22b7727ddd5454a427701fb9fddf4c28e8258ce0"
            },
            {
                "name": "booking-request-core",
                "namespace": "nexus",
                "revision": "11",
                "updated": "2021-02-26 10:22:06.122757189 +0000 UTC",
                "status": "deployed",
                "chart": "booking-request-core-0.1.0",
                "app_version": "02f27dacc475a4e3a806eb0165faeab6310045a7"
            },
            {
                "name": "currency-core",
                "namespace": "yarrrnicorns",
                "revision": "4",
                "updated": "2021-03-01 08:45:44.291841847 +0000 UTC",
                "status": "deployed",
                "chart": "currency-core-0.1.0",
                "app_version": "ab46f0e145de72be0ad855fd6fc8ca3c2ac39ad1"
            },
            {
                "name": "customer-core",
                "namespace": "nexus",
                "revision": "4",
                "updated": "2021-03-02 13:57:06.443292751 +0000 UTC",
                "status": "deployed",
                "chart": "customer-core-0.1.0",
                "app_version": "22002d5f9ca8771dcf6ab9ea864243f814c54f0b"
            },
            {
                "name": "datadog",
                "namespace": "datadog",
                "revision": "28",
                "updated": "2020-04-25 12:02:35.302967792 +0200 CEST",
                "status": "deployed",
                "chart": "datadog-2.0.14",
                "app_version": "7"
            },
            {
                "name": "external-dns",
                "namespace": "sre-tooling",
                "revision": "16",
                "updated": "2020-04-25 12:02:35.0378666 +0200 CEST",
                "status": "deployed",
                "chart": "external-dns-2.20.15",
                "app_version": "0.7.1"
            },
            {
                "name": "foreign-currency-exchange-core",
                "namespace": "yarrrnicorns",
                "revision": "5",
                "updated": "2021-03-04 16:30:43.515086591 +0000 UTC",
                "status": "deployed",
                "chart": "foreign-currency-exchange-core-0.1.0",
                "app_version": "2ac86025a7ac3498eea512c18bbdd3fc4da709e8"
            },
            {
                "name": "fortox-backend",
                "namespace": "pomato",
                "revision": "1074",
                "updated": "2021-03-05 08:24:06.466948093 +0000 UTC",
                "status": "deployed",
                "chart": "fortox-backend-0.1.0",
                "app_version": "680972d0ba47bcbcf7fa062743fbc0aea400e3fc"
            },
            {
                "name": "freight-gate",
                "namespace": "tnt",
                "revision": "12",
                "updated": "2021-03-04 14:17:38.865137759 +0000 UTC",
                "status": "deployed",
                "chart": "freight-gate-0.1.0",
                "app_version": "050ea74ce57e55467d89dd7104ccec8eaa40f136"
            },
            {
                "name": "quotation-core",
                "namespace": "yarrrnicorns",
                "revision": "6",
                "updated": "2021-03-03 15:25:04.966585948 +0000 UTC",
                "status": "deployed",
                "chart": "quotation-core-0.1.0",
                "app_version": "38219213b375e0c5a2a413866e09eb8f9a40b9d5"
            },
            {
                "name": "schedules-core",
                "namespace": "yarrrnicorns",
                "revision": "4",
                "updated": "2021-03-01 16:58:29.737290727 +0000 UTC",
                "status": "deployed",
                "chart": "schedules-core-0.1.0",
                "app_version": "f4ea8357cffc0123da40514c0e7ccf181261bb04"
            },
            {
                "name": "shipment-health",
                "namespace": "tnt",
                "revision": "14",
                "updated": "2021-03-03 08:37:36.571528852 +0000 UTC",
                "status": "deployed",
                "chart": "shipment-health-0.1.0",
                "app_version": "1780d1213cf50f692a3f40d856b2b8add7031883"
            },
            {
                "name": "tms",
                "namespace": "frontend",
                "revision": "101",
                "updated": "2021-03-04 16:43:24.911018479 +0000 UTC",
                "status": "deployed",
                "chart": "tms-0.1.0",
                "app_version": "cb1bd0cf4d0d08130360b523db0c5864339a3417"
            },
            {
                "name": "transport-plan",
                "namespace": "tnt",
                "revision": "22",
                "updated": "2021-03-05 02:58:19.889637962 +0000 UTC",
                "status": "deployed",
                "chart": "transport-plan-0.1.0",
                "app_version": "7d64c5195f1f3c2b3d0e4aef0670bd0173638b8d"
            },
            {
                "name": "transportplan-redis",
                "namespace": "tnt",
                "revision": "3",
                "updated": "2020-11-04 09:02:04.047425 +0100 CET",
                "status": "deployed",
                "chart": "redis-10.6.12",
                "app_version": "5.0.9"
            },
            {
                "name": "unleash",
                "namespace": "sre-tooling",
                "revision": "13",
                "updated": "2021-01-28 08:48:47.189032409 +0000 UTC",
                "status": "deployed",
                "chart": "unleash-0.1.0",
                "app_version": "67e9b20ce66cabc65f6d85a6ab0072ee90a966d8"
            },
            {
                "name": "websocket-core",
                "namespace": "nexus",
                "revision": "3",
                "updated": "2021-02-25 16:24:51.482020158 +0000 UTC",
                "status": "deployed",
                "chart": "websocket-core-0.1.0",
                "app_version": "8410731f42075e6519e57c4bcf29e5ba798cb353"
            }, 
        ];
    }
    async getReleaseHistory(namespace, releaseName) {
        const chart = (await this.getReleaseList()).find((x)=>x.namespace === namespace && x.name === releaseName
        )?.chart || `${releaseName}-0.1.0`;
        return [
            {
                chart,
                "revision": 4,
                "updated": "2020-07-01T08:02:46.685420988Z",
                "status": "superseded",
                "app_version": "b4563c9baa7617b137d8b272b7882968452ee952",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 5,
                "updated": "2020-07-02T07:52:45.2940391Z",
                "status": "superseded",
                "app_version": "4ef59b8397f0f20e20a8955682829454a7031618",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 6,
                "updated": "2020-07-02T11:04:21.905965626Z",
                "status": "superseded",
                "app_version": "87202bbfe0c323a26d7646261b8fdc60577fd1d4",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 7,
                "updated": "2020-07-02T11:19:52.505235401Z",
                "status": "superseded",
                "app_version": "9ad5627b22f8a04708a3590a01cd1c0f5ee0fe60",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 8,
                "updated": "2020-07-02T12:06:32.407068701Z",
                "status": "superseded",
                "app_version": "87202bbfe0c323a26d7646261b8fdc60577fd1d4",
                "description": "Rollback to 6"
            },
            {
                chart,
                "revision": 9,
                "updated": "2020-07-03T10:11:12.806231454Z",
                "status": "superseded",
                "app_version": "cc75c65ffdca5dc085df96a4b15107df43a4bfa7",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 10,
                "updated": "2020-10-07T12:48:20.868948428Z",
                "status": "superseded",
                "app_version": "1c6111dbef0c74e3d12c68e7d67f031b6e790dd1",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 11,
                "updated": "2020-10-08T08:04:06.065204968Z",
                "status": "superseded",
                "app_version": "8ac30783abeab398a3ab2d82488983de9f919772",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 12,
                "updated": "2020-10-09T13:49:15.64685762Z",
                "status": "superseded",
                "app_version": "6368e944160609e840b120666c0494dd3e1c8f3c",
                "description": "Upgrade complete"
            },
            {
                chart,
                "revision": 13,
                "updated": "2021-01-28T08:48:47.189032409Z",
                "status": "deployed",
                "app_version": "67e9b20ce66cabc65f6d85a6ab0072ee90a966d8",
                "description": "Upgrade complete"
            }, 
        ];
    }
    performRollback() {
        return Promise.resolve(`command not run, we're in frontend mock mode`);
    }
}
export { MockRollbackApi1 as MockRollbackApi };
function getDefaultRollbackApi() {
    const { HelmRollbackApiEndpoint  } = window.localStorage ?? {
    };
    if (typeof HelmRollbackApiEndpoint === 'string') {
        console.log('Rollback API: Using', {
            endpoint: HelmRollbackApiEndpoint
        }, 'from localStorage');
        return new HttpRollbackApi1(HelmRollbackApiEndpoint);
    } else if (window.location.hostname === "localhost") {
        console.log('Rollback API: Using mock data, no network interactions enabled');
        return new MockRollbackApi1();
    } else {
        const endpoint1 = new URL("/", window.location.href).toString();
        console.log('Rollback API: Using default', {
            endpoint: endpoint1
        }, 'from our origin');
        return new HttpRollbackApi1(endpoint1);
    }
}
const DefaultRollbackApi1 = getDefaultRollbackApi();
export { DefaultRollbackApi1 as DefaultRollbackApi };


/**
 * sf-api.js — Salesforce REST API wrapper
 * OAuth 2.0 User-Agent Flow + Standard REST API
 */

const SF_CONFIG = {
    // ① Paste your Connected App Consumer Key here after creating it in SF Setup
    consumerKey: '3MVG9k02hQhyUgQAAc7Ngq.yraafMC1yV06JlTQ.GWMXGemkgQQl44po5XZC7ljeU9ngcPfwpIMZZIsDWL008',

    // ② Change to https://test.salesforce.com for Sandbox orgs
    loginUrl: 'https://login.salesforce.com',

    apiVersion: 'v63.0',

    // Normalised to origin root so /index.html and / both match the same callback
    // This value must be listed verbatim in the Connected App → Callback URLs list
    callbackUrl: window.location.origin + '/'
};

const TOKEN_KEY = 'lavanda_sf_token';
const INSTANCE_KEY = 'lavanda_sf_instance';

const SalesforceAPI = {
    getToken() { return sessionStorage.getItem(TOKEN_KEY); },
    getInstanceUrl() { return sessionStorage.getItem(INSTANCE_KEY) || SF_CONFIG.loginUrl; },
    isAuthenticated() { return !!this.getToken(); },

    login() {
        if (!SF_CONFIG.consumerKey) {
            alert('Налаштуйте Consumer Key у website/shared/sf-api.js\n\nSetup: App Manager → New Connected App → Enable OAuth\nCallback URL: ' + SF_CONFIG.callbackUrl + '\nScopes: api, refresh_token');
            return;
        }
        const params = new URLSearchParams({
            response_type: 'token',
            client_id: SF_CONFIG.consumerKey,
            redirect_uri: SF_CONFIG.callbackUrl,
            scope: 'api'
        });
        window.location.href = SF_CONFIG.loginUrl + '/services/oauth2/authorize?' + params;
    },

    handleCallback() {
        const hash = window.location.hash.substring(1);
        if (!hash) return false;
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const instanceUrl = params.get('instance_url');
        if (token) {
            sessionStorage.setItem(TOKEN_KEY, token);
            if (instanceUrl) sessionStorage.setItem(INSTANCE_KEY, decodeURIComponent(instanceUrl));
            history.replaceState(null, '', window.location.pathname + window.location.search);
            return true;
        }
        return false;
    },

    logout() {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(INSTANCE_KEY);
    },

    async request(method, path, body = null) {
        const token = this.getToken();
        if (!token) throw new Error('Not authenticated');
        const url = this.getInstanceUrl() + '/services/data/' + SF_CONFIG.apiVersion + path;
        const options = {
            method,
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        if (body) options.body = JSON.stringify(body);
        const response = await fetch(url, options);
        if (response.status === 401) { this.logout(); throw new Error('Session expired'); }
        if (!response.ok) {
            const t = await response.text();
            throw new Error('API ' + response.status + ': ' + t);
        }
        if (response.status === 204) return null;
        return response.json();
    },

    async getContacts(search) {
        let q = "SELECT Id, Name, ClientName__c, Address__c, GeneralDiscount__c, Client_Status__c, GeneralPrice__c, Description__c, CreatedDate FROM Contact__c";
        if (search) {
            const s = search.replace(/'/g, "\\'");
            q += " WHERE Name LIKE '%" + s + "%' OR ClientName__c LIKE '%" + s + "%'";
        }
        q += ' ORDER BY CreatedDate DESC LIMIT 50';
        const r = await this.request('GET', '/query/?q=' + encodeURIComponent(q));
        return r.records || [];
    },

    async getContact(id) { return this.request('GET', '/sobjects/Contact__c/' + id); },
    async createContact(data) { return this.request('POST', '/sobjects/Contact__c/', data); },
    async updateContact(id, data) { return this.request('PATCH', '/sobjects/Contact__c/' + id, data); },

    async getCurtains(contactId) {
        // Minimal set for the list card — avoids FLS failures on rarely-accessible fields.
        // Full record is loaded via getCurtain(id) when the agent opens the edit form.
        const q = "SELECT Id, Name, Name__c, Type__c, Room__c, " +
            "GeneralPrice__c, Meterage__c, Status__c, CoefficientZbirki__c, " +
            "CurtainDiscount__c, HeightPoint__c, Height__c, CreatedDate " +
            "FROM Curtain__c WHERE Contact__c = '" + contactId + "' ORDER BY CreatedDate DESC";
        const r = await this.request('GET', '/query/?q=' + encodeURIComponent(q));
        return r.records || [];
    },

    async getCurtain(id) { return this.request('GET', '/sobjects/Curtain__c/' + id); },
    async createCurtain(data) { return this.request('POST', '/sobjects/Curtain__c/', data); },
    async updateCurtain(id, data) { return this.request('PATCH', '/sobjects/Curtain__c/' + id, data); },

    async saveImageToSalesforce(curtainId, base64Data) {
        const body = {
            Title: 'Curtain_' + new Date().toISOString().substring(0, 10),
            VersionData: base64Data,
            PathOnClient: 'curtain_image.png',
            FirstPublishLocationId: curtainId
        };
        return this.request('POST', '/sobjects/ContentVersion/', body);
    },

    async getUserInfo() {
        const token = this.getToken();
        if (!token) return null;
        try {
            const r = await fetch(this.getInstanceUrl() + '/services/oauth2/userinfo', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (r.ok) return r.json();
        } catch (e) { /* ignore */ }
        return null;
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SalesforceAPI;
} else {
    window.SalesforceAPI = SalesforceAPI;
}


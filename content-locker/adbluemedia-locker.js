/**
 * OGAds Content Locker
 * Fetches OGAds incentive offers and unlocks after the configured user action.
 */

(function() {
    'use strict';

    const CONFIG = window.OGADS_CONFIG || {
        apiToken: '',
        offerFeedUrl: 'https://appsave.online/api/v2',
        ipLookupUrls: [
            'https://api.ipify.org?format=json',
            'https://api64.ipify.org?format=json'
        ],
        maxOffers: 3,
        minOffers: '',
        ctype: '',
        requiredOffers: 1,
        unlockMode: 'postback',
        projectSlug: '1fmovie',
        postbackStatusUrl: 'https://streamaio.com/api/unlock-status.php',
        pollIntervalMs: 3000,
        pollTimeoutMs: 600000,
        clickUnlockDelay: 1200
    };

    if (!CONFIG.apiToken) {
        console.error('OGAds API token not found. Please load OGAds config before this script.');
    }

    let lockerInstance = null;
    let isUnlocked = false;
    let completedOfferIds = [];

    class OgadsLocker {
        constructor(options = {}) {
            this.config = { ...CONFIG, ...options };
            this.overlay = null;
            this.offersContainer = null;
            this.loadingElement = null;
            this.errorElement = null;
            this.onUnlockCallback = null;
            this.isLoadingOffers = false;
            this.sessionId = null;
            this.pollTimer = null;
            this.pollStartedAt = 0;
            this.isWaitingForConversion = false;

            this.init();
        }

        init() {
            this.createLockerHTML();
            this.attachEventListeners();
            this.loadOffers();
        }

        createLockerHTML() {
            let overlay = document.getElementById('adblue-locker-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'adblue-locker-overlay';
                overlay.className = 'adblue-locker-overlay';
                overlay.innerHTML = this.getLockerHTML();
                document.body.appendChild(overlay);
            }

            this.overlay = overlay;
            this.offersContainer = document.getElementById('offers-container');
            this.loadingElement = document.getElementById('offers-loading');
            this.errorElement = document.getElementById('offers-error');

            this.addContentImage();
            this.updateTitleWithContentName();
        }

        updateTitleWithContentName() {
            let contentTitle = null;

            const nameElement = document.querySelector('#w-info .name, #w-info h1[itemprop="name"], #w-info .name[itemprop="name"]');
            if (nameElement) {
                contentTitle = nameElement.textContent.trim();
            }

            if (!contentTitle && window.currentSeries) {
                contentTitle = window.currentSeries.title || window.currentSeries.name || '';
            }

            if (!contentTitle) {
                const h1 = document.querySelector('h1, [itemprop="name"]');
                if (h1) {
                    contentTitle = h1.textContent.trim();
                }
            }

            if (contentTitle) {
                const titleElement = document.getElementById('adblue-locker-title');
                if (titleElement) {
                    titleElement.innerHTML = `Complete one free quick offer to continue watching <span class="content-name">${this.escapeHtml(contentTitle)}</span>.`;
                }
            }
        }

        addContentImage() {
            let contentImage = null;

            const posterImg = document.querySelector('#w-info .poster img, #w-info .poster img[itemprop="image"]');
            if (posterImg && posterImg.src) {
                contentImage = posterImg.src;
            }

            if (!contentImage) {
                const videoPoster = document.querySelector('#my-video[poster], video[poster]');
                if (videoPoster && videoPoster.getAttribute('poster')) {
                    contentImage = videoPoster.getAttribute('poster');
                }
            }

            if (!contentImage && window.currentSeries) {
                contentImage = window.currentSeries.poster || window.currentSeries.thumbnail || '';
            }

            if (!contentImage) {
                const img = document.querySelector('img[src*="poster"], img[src*="thumbnail"], .poster img, .thumbnail img');
                if (img && img.src) {
                    contentImage = img.src;
                }
            }

            if (contentImage) {
                const backdrop = this.overlay.querySelector('.adblue-locker-backdrop');
                const posterContainer = this.overlay.querySelector('#poster-container');

                if (backdrop) {
                    backdrop.style.backgroundImage = `url(${this.escapeCssUrl(contentImage)})`;
                    backdrop.style.backgroundSize = 'cover';
                    backdrop.style.backgroundPosition = 'center';
                    backdrop.style.opacity = '0.12';
                }

                if (posterContainer) {
                    posterContainer.innerHTML = `<img src="${this.escapeHtml(contentImage)}" alt="Content preview">`;
                }
            }
        }

        getLockerHTML() {
            return `
                <div class="adblue-locker-modal">
                    <div class="adblue-locker-backdrop"></div>

                    <div class="adblue-locker-header">
                        <div class="adblue-locker-icon" id="adblue-locker-icon">
                            <div class="poster-container" id="poster-container"></div>
                            <div class="lock-overlay">
                                <div class="lock-animation">
                                    <i class="bi bi-lock-fill"></i>
                                </div>
                            </div>
                            <div class="loading-bubble"></div>
                        </div>
                        <h2 class="adblue-locker-title" id="adblue-locker-title">Complete one free quick offer to continue watching.</h2>
                    </div>

                    <div class="adblue-locker-content">

                        <!-- Offer list view -->
                        <div id="offer-list-view" class="adblue-locker-offers-container">
                            <div class="offers-loading" id="offers-loading">
                                <div class="loading-spinner"></div>
                            </div>
                            <div id="offers-container" class="offers-grid"></div>
                            <div id="offers-error" class="offers-error" style="display: none;">
                                <i class="bi bi-exclamation-triangle"></i>
                                <p>Unable to load offers. Please refresh.</p>
                            </div>
                        </div>

                        <!-- Offer detail view (shown when user taps an offer) -->
                        <div id="offer-detail-view" class="offer-detail-view" style="display: none;">
                            <div class="offer-detail-title" id="offer-detail-title"></div>
                            <div class="offer-detail-description" id="offer-detail-description"></div>
                            <div class="offer-detail-actions">
                                <button class="offer-btn-back" id="offer-btn-back">
                                    <i class="bi bi-arrow-left"></i> Back
                                </button>
                                <a class="offer-btn-start" id="offer-btn-start" href="#" target="_blank" rel="noopener noreferrer">
                                    Start <i class="bi bi-arrow-right"></i>
                                </a>
                            </div>
                            <div id="offer-waiting-status" class="offer-waiting-status" style="display: none;" role="status">
                                <div class="waiting-spinner"></div>
                                <p class="waiting-message">Complete the offer in the new tab. This page will unlock automatically when verified.</p>
                                <p class="waiting-timeout-message" style="display: none;">Still waiting? Finish the offer or try another one below.</p>
                            </div>
                        </div>

                    </div>

                    <div class="adblue-locker-footer">
                        <p class="footer-note">
                            <i class="bi bi-shield-check"></i>
                            Verified & secure
                        </p>
                    </div>
                </div>
            `;
        }

        attachEventListeners() {
            this.overlay.addEventListener('click', () => {});
        }

        show() {
            if (isUnlocked) {
                return this;
            }

            this.ensureSessionId();
            this.hideWaitingStatus();

            if (this.overlay) {
                this.overlay.classList.remove('unlocking');
                this.overlay.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }

            if (!this.offersContainer || !this.offersContainer.children.length) {
                this.loadOffers();
            }

            return this;
        }

        ensureSessionId() {
            if (this.sessionId) return this.sessionId;
            this.sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : ('s' + Date.now() + Math.random().toString(36).slice(2, 11));
            return this.sessionId;
        }

        getTrackingSubs() {
            const series = window.currentSeries || {};
            let type = series.type || new URLSearchParams(window.location.search).get('type') || '';
            const title = series.title || series.name || '';
            return {
                aff_sub: this.ensureSessionId(),
                aff_sub2: this.config.projectSlug || 'default',
                aff_sub4: title,
                aff_sub5: type
            };
        }

        appendTrackingToUrl(url) {
            if (!url || url === '#') return url;

            try {
                const parsed = new URL(url, window.location.href);
                const subs = this.getTrackingSubs();
                Object.entries(subs).forEach(([key, value]) => {
                    if (value) parsed.searchParams.set(key, value);
                });
                return parsed.toString();
            } catch (error) {
                console.warn('Could not append tracking to offer URL:', error);
                return url;
            }
        }

        hide() {
            if (this.overlay) {
                this.overlay.classList.add('unlocking');
                setTimeout(() => {
                    this.overlay.style.display = 'none';
                    document.body.style.overflow = '';
                    if (this.onUnlockCallback) {
                        this.onUnlockCallback();
                    }
                }, 500);
            }
        }

        async loadOffers() {
            if (!this.offersContainer || this.isLoadingOffers) return;

            this.isLoadingOffers = true;

            if (this.loadingElement) {
                this.loadingElement.style.display = 'flex';
            }
            if (this.errorElement) {
                this.errorElement.style.display = 'none';
            }

            try {
                const visitorIp = await this.fetchVisitorIp();
                const offers = await this.fetchOgadsOffers(visitorIp);
                this.handleOffersResponse(offers);
            } catch (error) {
                console.error('OGAds offers failed to load:', error);
                this.handleOffersError();
            } finally {
                this.isLoadingOffers = false;
            }
        }

        async fetchVisitorIp() {
            if (this.config.visitorIp) {
                return this.config.visitorIp;
            }

            const lookupUrls = this.config.ipLookupUrls || [];
            for (const url of lookupUrls) {
                try {
                    const response = await fetch(url, { cache: 'no-store' });
                    if (!response.ok) continue;

                    const contentType = response.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                        const data = await response.json();
                        const ip = data.ip || data.query;
                        if (ip) return ip;
                    } else {
                        const text = await response.text();
                        const match = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b|[a-f0-9:]{8,}/i);
                        if (match) return match[0];
                    }
                } catch (error) {
                    console.warn('Visitor IP lookup failed:', url, error);
                }
            }

            throw new Error('Unable to determine visitor IP for OGAds request.');
        }

        async fetchOgadsOffers(visitorIp) {
            const response = await fetch(this.buildOfferFeedUrl(visitorIp), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${this.config.apiToken}`
                },
                cache: 'no-store'
            });

            if (!response.ok) {
                throw new Error(`OGAds API returned HTTP ${response.status}`);
            }

            const data = await response.json();
            return this.normalizeOffers(data);
        }

        buildOfferFeedUrl(visitorIp) {
            const series = window.currentSeries || {};
            const title = series.title || series.name || '';
            let type = series.type || '';

            if (!type) {
                type = new URLSearchParams(window.location.search).get('type') || '';
            }

            const params = new URLSearchParams({
                ip: visitorIp,
                user_agent: navigator.userAgent
            });

            this.addOptionalParam(params, 'ctype', this.config.ctype);
            this.addOptionalParam(params, 'max', this.config.maxOffers);
            this.addOptionalParam(params, 'min', this.config.minOffers);
            this.addOptionalParam(params, 'aff_sub4', title);
            this.addOptionalParam(params, 'aff_sub5', type);

            return `${this.config.offerFeedUrl}?${params.toString()}`;
        }

        addOptionalParam(params, key, value) {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, value);
            }
        }

        normalizeOffers(data) {
            if (Array.isArray(data)) return data;

            const candidates = [
                data && data.offers,
                data && data.data,
                data && data.results,
                data && data.campaigns,
                data && data.response
            ];

            for (const candidate of candidates) {
                if (Array.isArray(candidate)) return candidate;
                if (candidate && typeof candidate === 'object') return Object.values(candidate);
            }

            return [];
        }

        handleOffersResponse(offers) {
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }

            if (!offers || !Array.isArray(offers) || offers.length === 0) {
                this.handleOffersError();
                return;
            }

            this.renderOffers(offers.slice(0, this.config.maxOffers || 3));
        }

        renderOffers(offers) {
            if (!this.offersContainer) return;

            this.ensureSessionId();

            // Store normalized offers for detail view lookup
            this._offers = offers.map((offer, index) => this.normalizeOffer(offer, index));

            this.offersContainer.innerHTML = this._offers.map((offer) => {
                return `
                    <div class="offer-card"
                         data-offer-id="${this.escapeHtml(offer.id)}">
                        <div class="offer-content">
                            <div class="offer-info">
                                <div class="offer-title">${this.escapeHtml(offer.title)}</div>
                                <div class="offer-requirement">${this.escapeHtml(offer.requirement)}</div>
                            </div>
                            <div class="offer-arrow"><i class="bi bi-chevron-right"></i></div>
                        </div>
                    </div>
                `;
            }).join('');

            this.offersContainer.querySelectorAll('.offer-card').forEach(card => {
                card.addEventListener('click', () => {
                    const offer = this._offers.find(o => o.id === card.dataset.offerId);
                    if (offer) this.showOfferDetail(offer);
                });
            });
        }

        showOfferDetail(offer) {
            const listView   = document.getElementById('offer-list-view');
            const detailView = document.getElementById('offer-detail-view');
            const titleEl    = document.getElementById('offer-detail-title');
            const descEl     = document.getElementById('offer-detail-description');
            const startBtn   = document.getElementById('offer-btn-start');
            const backBtn    = document.getElementById('offer-btn-back');

            if (!detailView) return;

            titleEl.textContent  = offer.title;
            descEl.textContent   = offer.requirement || 'Complete this offer to unlock access.';

            const trackedUrl = this.appendTrackingToUrl(offer.url);
            startBtn.href = trackedUrl;

            // Start button click → open offer + begin postback polling
            startBtn.onclick = (e) => {
                this.handleOfferClick(offer.id);
            };

            backBtn.onclick = () => this.hideOfferDetail();

            listView.style.display  = 'none';
            detailView.style.display = 'block';
        }

        hideOfferDetail() {
            const listView   = document.getElementById('offer-list-view');
            const detailView = document.getElementById('offer-detail-view');
            this.hideWaitingStatus();
            if (listView)   listView.style.display   = 'block';
            if (detailView) detailView.style.display = 'none';
        }

        normalizeOffer(offer, index) {
            const title = offer.name ||
                offer.title ||
                offer.anchor ||
                offer.offer_name ||
                offer.campaign_name ||
                `Offer ${index + 1}`;

            const url = offer.link ||
                offer.url ||
                offer.offer_url ||
                offer.tracking_url ||
                offer.click_url ||
                '#';

            const rawRequirement = offer.description ||
                offer.requirement ||
                offer.instructions ||
                offer.conversion ||
                '';

            // Strip HTML tags and decode entities from description
            const requirement = this.stripHtml(rawRequirement);

            const id = offer.offerid ||
                offer.offer_id ||
                offer.id ||
                offer.campaign_id ||
                index;

            return { id: String(id), title, url, requirement };
        }

        stripHtml(html) {
            if (!html) return '';
            const div = document.createElement('div');
            div.innerHTML = html;
            return (div.textContent || div.innerText || '').trim();
        }

        handleOfferClick(offerId) {
            console.log('OGAds offer clicked:', offerId);

            if (this.config.unlockMode === 'postback') {
                this.showWaitingStatus();
                this.startPostbackPolling();
                return;
            }

            if (this.config.unlockMode !== 'click') {
                return;
            }

            if (!completedOfferIds.includes(offerId)) {
                completedOfferIds.push(offerId);
            }

            if (completedOfferIds.length >= (this.config.requiredOffers || 1)) {
                setTimeout(() => this.unlock(), this.config.clickUnlockDelay || 0);
            }
        }

        showWaitingStatus() {
            this.isWaitingForConversion = true;
            const el = document.getElementById('offer-waiting-status');
            if (el) {
                el.style.display = 'block';
            }
        }

        hideWaitingStatus() {
            this.isWaitingForConversion = false;
            const el = document.getElementById('offer-waiting-status');
            if (el) {
                el.style.display = 'none';
                const timeoutMsg = el.querySelector('.waiting-timeout-message');
                if (timeoutMsg) timeoutMsg.style.display = 'none';
            }
        }

        startPostbackPolling() {
            if (this.pollTimer) return;

            const statusUrl = this.config.postbackStatusUrl;
            if (!statusUrl) {
                console.error('postbackStatusUrl is not configured');
                return;
            }

            this.pollStartedAt = Date.now();
            const interval = this.config.pollIntervalMs || 3000;
            const timeout = this.config.pollTimeoutMs || 600000;
            const required = this.config.requiredOffers || 1;

            const poll = async () => {
                if (isUnlocked) {
                    this.stopPostbackPolling();
                    return;
                }

                if (Date.now() - this.pollStartedAt > timeout) {
                    this.stopPostbackPolling();
                    const el = document.getElementById('offer-waiting-status');
                    const timeoutMsg = el && el.querySelector('.waiting-timeout-message');
                    if (timeoutMsg) timeoutMsg.style.display = 'block';
                    return;
                }

                try {
                    const params = new URLSearchParams({
                        session: this.ensureSessionId(),
                        project: this.config.projectSlug || 'default'
                    });
                    const response = await fetch(`${statusUrl}?${params.toString()}`, {
                        method: 'GET',
                        cache: 'no-store',
                        credentials: 'omit'
                    });

                    if (!response.ok) {
                        console.warn('Unlock status HTTP', response.status);
                        return;
                    }

                    const data = await response.json();
                    const completed = Number(data.completedOffers) || 0;

                    if (data.unlocked && completed >= required) {
                        this.stopPostbackPolling();
                        this.hideWaitingStatus();
                        this.unlock();
                    }
                } catch (error) {
                    console.warn('Unlock status poll failed:', error);
                }
            };

            poll();
            this.pollTimer = setInterval(poll, interval);
        }

        stopPostbackPolling() {
            if (this.pollTimer) {
                clearInterval(this.pollTimer);
                this.pollTimer = null;
            }
        }

        handleOffersError() {
            if (this.loadingElement) {
                this.loadingElement.style.display = 'none';
            }
            if (this.errorElement) {
                this.errorElement.style.display = 'block';
            }
            if (this.offersContainer) {
                this.offersContainer.innerHTML = '';
            }
        }

        unlock() {
            if (isUnlocked) return;

            this.stopPostbackPolling();
            this.hideWaitingStatus();
            isUnlocked = true;
            this.hide();
            console.log('Content unlocked!');
        }

        onUnlock(callback) {
            this.onUnlockCallback = callback;
            return this;
        }

        isUnlocked() {
            return isUnlocked;
        }

        escapeHtml(text) {
            if (!text) return '';
            const div = document.createElement('div');
            div.textContent = String(text);
            return div.innerHTML;
        }

        escapeCssUrl(url) {
            return String(url).replace(/["\\\n\r]/g, '');
        }
    }

    function initLocker(options) {
        if (lockerInstance) {
            return lockerInstance;
        }

        if (!document.getElementById('adblue-locker-css')) {
            const link = document.createElement('link');
            link.id = 'adblue-locker-css';
            link.rel = 'stylesheet';
            link.href = 'content-locker/adbluemedia-locker.css';
            document.head.appendChild(link);
        }

        lockerInstance = new OgadsLocker(options);
        return lockerInstance;
    }

    function showLocker(options) {
        const locker = initLocker(options);
        locker.show();
        return locker;
    }

    window.OgadsLocker = OgadsLocker;
    window.showOgadsLocker = showLocker;
    window.initOgadsLocker = initLocker;
    window.isOgadsLockerUnlocked = () => isUnlocked;

    // Backward-compatible aliases used by the existing page markup.
    window.AdBlueMediaLocker = OgadsLocker;
    window.showAdBlueLocker = showLocker;
    window.initAdBlueLocker = initLocker;

    if (document.body.dataset.autoShowLocker === 'true') {
        document.addEventListener('DOMContentLoaded', () => {
            showLocker();
        });
    }
})();

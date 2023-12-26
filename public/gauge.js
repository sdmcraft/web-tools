const template = document.createElement('template');

template.innerHTML = `
<link rel="stylesheet" href="/gauge.css" />
<div class="gauge-container">
    <div class="bar-container">
        <div class="gauge-bar left-bar">
            <div class="gauge-bar-inner left-bar-inner"></div>
        </div>
        <div style="width: 1px"></div>
        <!-- Add some spacing between bars -->
        <div class="gauge-bar right-bar">
            <div class="gauge-bar-inner right-bar-inner"></div>
        </div>
    </div>
    <div class="value">
    </div>
</div>
`;

class GaugeWidget extends HTMLElement {
    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ 'mode': 'open' });
        this._shadowRoot.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this._shadowRoot.querySelector('.value').innerText = this.value;
        if (this.value >= 0) {
            this._shadowRoot.querySelector('.right-bar-inner').style.width = `${this.value}%`;
            this._shadowRoot.querySelector('.value').style.color = 'green';
            this._shadowRoot.querySelector('.value').innerText += '🚀';
        } else {
            this._shadowRoot.querySelector('.left-bar-inner').style.width = `${Math.abs(this.value)}%`;
            this._shadowRoot.querySelector('.value').style.color = 'red';
        }
    }

    get value() {
        return this.getAttribute('value');
    }

}

window.customElements.define('gauge-widget', GaugeWidget);
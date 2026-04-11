function t(t,e,i,s){var n,o=arguments.length,r=o<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o<3?n(r):o>3?n(e,i,r):n(e,i))||r);return o>3&&r&&Object.defineProperty(e,i,r),r}"function"==typeof SuppressedError&&SuppressedError;
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const r=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new o(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:l,defineProperty:c,getOwnPropertyDescriptor:h,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:g}=Object,u=globalThis,f=u.trustedTypes,_=f?f.emptyScript:"",m=u.reactiveElementPolyfillSupport,v=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?_:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},y=(t,e)=>!l(t,e),b={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:y};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let A=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=h(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const o=s?.call(this);n?.call(this,e),this.requestUpdate(t,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=g(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:$).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=s;const o=n.fromAttribute(e,t.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const o=this.constructor;if(!1===s&&(n=this[t]),i??=o.getPropertyOptions(t),!((i.hasChanged??y)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};A.elementStyles=[],A.shadowRootOptions={mode:"open"},A[v("elementProperties")]=new Map,A[v("finalized")]=new Map,m?.({ReactiveElement:A}),(u.reactiveElementVersions??=[]).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const C=globalThis,w=t=>t,E=C.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+P,H=`<${k}>`,O=document,M=()=>O.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,U=Array.isArray,z="[ \t\n\f\r]",N=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,B=/>/g,D=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,I=/"/g,L=/^(?:script|style|textarea|title)$/i,q=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),W=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),V=new WeakMap,K=O.createTreeWalker(O,129);function Z(t,e){if(!U(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const F=(t,e)=>{const i=t.length-1,s=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=N;for(let e=0;e<i;e++){const i=t[e];let a,l,c=-1,h=0;for(;h<i.length&&(r.lastIndex=h,l=r.exec(i),null!==l);)h=r.lastIndex,r===N?"!--"===l[1]?r=R:void 0!==l[1]?r=B:void 0!==l[2]?(L.test(l[2])&&(n=RegExp("</"+l[2],"g")),r=D):void 0!==l[3]&&(r=D):r===D?">"===l[0]?(r=n??N,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?D:'"'===l[3]?I:j):r===I||r===j?r=D:r===R||r===B?r=N:(r=D,n=void 0);const d=r===D&&t[e+1].startsWith("/>")?" ":"";o+=r===N?i+H:c>=0?(s.push(a),i.slice(0,c)+x+i.slice(c)+P+d):i+P+(-2===c?e:d)}return[Z(t,o+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class J{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[l,c]=F(t,e);if(this.el=J.createElement(l,i),K.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=K.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(x)){const e=c[o++],i=s.getAttribute(t).split(P),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?et:"?"===r[1]?it:"@"===r[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(P)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(P),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],M()),K.nextNode(),a.push({type:2,index:++n});s.append(t[e],M())}}}else if(8===s.nodeType)if(s.data===k)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(P,t+1));)a.push({type:7,index:n}),t+=P.length-1}n++}}static createElement(t,e){const i=O.createElement("template");return i.innerHTML=t,i}}function Q(t,e,i=t,s){if(e===W)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=T(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Q(t,n._$AS(t,e.values),n,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??O).importNode(e,!0);K.currentNode=s;let n=K.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new Y(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new nt(n,this,t)),this._$AV.push(e),a=i[++r]}o!==a?.index&&(n=K.nextNode(),o++)}return K.currentNode=O,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),T(t)?t===G||null==t||""===t?(this._$AH!==G&&this._$AR(),this._$AH=G):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>U(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==G&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(O.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=J.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new J(t)),e}k(t){U(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new Y(this.O(M()),this.O(M()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=w(t).nextSibling;w(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=G,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(t,e=this,i,s){const n=this.strings;let o=!1;if(void 0===n)t=Q(this,t,e,0),o=!T(t)||t!==this._$AH&&t!==W,o&&(this._$AH=t);else{const s=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=Q(this,s[i+r],e,r),a===W&&(a=this._$AH[r]),o||=!T(a)||a!==this._$AH[r],a===G?t=G:t!==G&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(t)}j(t){t===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===G?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==G)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??G)===W)return;const i=this._$AH,s=t===G&&i!==G||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const ot=C.litHtmlPolyfillSupport;ot?.(J,Y),(C.litHtmlVersions??=[]).push("3.3.2");const rt=globalThis;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */class at extends A{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new Y(e.insertBefore(M(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}at._$litElement$=!0,at.finalized=!0,rt.litElementHydrateSupport?.({LitElement:at});const lt=rt.litElementPolyfillSupport;lt?.({LitElement:at}),(rt.litElementVersions??=[]).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ct=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:y},dt=(t=ht,e,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),o.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function pt(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function gt(t){return pt({...t,state:!0,attribute:!1})}const ut={"Cooking.Oven.Program.HeatingMode.HotAir":"hot-air.svg","Cooking.Oven.Program.HeatingMode.TopBottomHeating":"top-bottom.svg","Cooking.Oven.Program.HeatingMode.HotAirEco":"hot-air-eco.svg","Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco":"top-bottom-eco.svg","Cooking.Oven.Program.HeatingMode.HotAirGrilling":"hot-air-grill.svg","Cooking.Oven.Program.HeatingMode.PizzaSetting":"pizza.svg","Cooking.Oven.Program.HeatingMode.SlowCook":"slow-cook.svg","Cooking.Oven.Program.HeatingMode.BottomHeating":"bottom-heat.svg","Cooking.Oven.Program.HeatingMode.KeepWarm":"keep-warm.svg","Cooking.Oven.Program.HeatingMode.PreheatOvenware":"preheat-ovenware.svg","Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial":"frozen.svg","Cooking.Oven.Program.HeatingMode.GrillLargeArea":"grill-large.svg","Cooking.Oven.Program.HeatingMode.GrillSmallArea":"grill-small.svg"},ft={"Cooking.Oven.Program.HeatingMode.HotAir":"4D Hot air","Cooking.Oven.Program.HeatingMode.TopBottomHeating":"Top and bottom heat","Cooking.Oven.Program.HeatingMode.HotAirEco":"Hot air eco","Cooking.Oven.Program.HeatingMode.TopBottomHeatingEco":"Top and bottom heat eco","Cooking.Oven.Program.HeatingMode.HotAirGrilling":"Hot air grilling","Cooking.Oven.Program.HeatingMode.PizzaSetting":"Pizza setting","Cooking.Oven.Program.HeatingMode.SlowCook":"Low-temperature cooking","Cooking.Oven.Program.HeatingMode.BottomHeating":"Bottom heat","Cooking.Oven.Program.HeatingMode.KeepWarm":"Keep warm","Cooking.Oven.Program.HeatingMode.PreheatOvenware":"Plate warming","Cooking.Oven.Program.HeatingMode.FrozenHeatupSpecial":"coolStart function","Cooking.Oven.Program.HeatingMode.GrillLargeArea":"Grill, large area","Cooking.Oven.Program.HeatingMode.GrillSmallArea":"Grill, small area"};function _t(t){const e=Math.floor(t/3600),i=Math.floor(t%3600/60);return`${String(e).padStart(2,"0")}:${String(i).padStart(2,"0")}`}function mt(t){if(!t||"unavailable"===t||"unknown"===t)return"--:--";const e=t.split(":");if(2!==e.length)return"--:--";const i=parseInt(e[0],10),s=parseInt(e[1],10);return isNaN(i)||isNaN(s)?"--:--":`${String(i).padStart(2,"0")}:${String(s).padStart(2,"0")}`}const vt=["run","pause"];function $t(t,e){const i=t.states[e.program_progress_entity]?.state;if(!i||"unavailable"===i||"unknown"===i)return null;const s=parseInt(i,10);return isNaN(s)||s>=100?null:s}const yt=[{key:"operation_state_entity",label:"Operation State Entity"},{key:"active_program_entity",label:"Active Program Entity"},{key:"remaining_time_entity",label:"Remaining Time Entity"},{key:"elapsed_time_entity",label:"Elapsed Time Entity"},{key:"cavity_temp_entity",label:"Cavity Temperature Entity"},{key:"setpoint_temp_entity",label:"Setpoint Temperature Entity"},{key:"program_progress_entity",label:"Program Progress Entity"},{key:"door_entity",label:"Door Entity (binary_sensor)"}];let bt=class extends at{setConfig(t){this._config=t}_entityChanged(t){if(!this._config)return;const e=t.target.getAttribute("data-key");if(!e)return;const i={...this._config,[e]:t.detail.value};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i}}))}_nameChanged(t){if(!this._config)return;const e={...this._config,name:t.target.value||void 0};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e}}))}_resourcesPathChanged(t){if(!this._config)return;const e=t.target.value.trim(),i={...this._config,resources_path:e||void 0};this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i}}))}render(){return this._config?q`
      <div class="editor">
        ${yt.map(({key:t,label:e})=>q`
            <ha-entity-picker
              .hass=${this.hass}
              .value=${this._config[t]??""}
              .label=${e}
              data-key=${t}
              @value-changed=${this._entityChanged}
              allow-custom-entity
            ></ha-entity-picker>
          `)}
        <ha-textfield
          label="Card Name (optional)"
          .value=${this._config.name??""}
          @input=${this._nameChanged}
        ></ha-textfield>
        <ha-textfield
          label="Resources Path (manual install only — leave blank for HACS)"
          .value=${this._config.resources_path??""}
          placeholder="/local/siemens-oven-card"
          @input=${this._resourcesPathChanged}
        ></ha-textfield>
      </div>
    `:q``}static{this.styles=r`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }

    ha-entity-picker,
    ha-textfield {
      display: block;
    }
  `}};t([pt({attribute:!1})],bt.prototype,"hass",void 0),t([pt({attribute:!1})],bt.prototype,"_config",void 0),bt=t([ct("siemens-oven-card-editor")],bt),window.customCards??=[],window.customCards.push({type:"siemens-oven-card",name:"Siemens Oven Card",description:"Card for Siemens Home Connect ovens",preview:!1}),console.info("%c SIEMENS-OVEN-CARD %c v0.1.0 ","background:#8df427;color:#000;font-weight:bold;","background:#555;color:#fff;");let At=class extends at{constructor(){super(...arguments),this._tick=0}get _resourcesPath(){return this._config?.resources_path??"/hacsfiles/siemens-oven-card"}setConfig(t){const e=["operation_state_entity","active_program_entity","remaining_time_entity","elapsed_time_entity","cavity_temp_entity","setpoint_temp_entity","program_progress_entity","door_entity"];for(const i of e)if(!t[i])throw new Error(`siemens-oven-card: missing required config field: ${i}`);this._config=t}static getConfigElement(){return document.createElement("siemens-oven-card-editor")}static getStubConfig(){const t="siemens_hb676g5s6_68a40e6a233e";return{operation_state_entity:`sensor.${t}_bsh_common_status_operationstate`,active_program_entity:`sensor.${t}_active_program`,remaining_time_entity:`sensor.${t}_bsh_common_option_remainingprogramtime`,elapsed_time_entity:`sensor.${t}_bsh_common_option_elapsedprogramtime`,cavity_temp_entity:`sensor.${t}_cooking_oven_status_currentcavitytemperature`,setpoint_temp_entity:`sensor.${t}_cooking_oven_option_setpointtemperature`,program_progress_entity:`sensor.${t}_bsh_common_option_programprogress`,door_entity:`binary_sensor.${t}_bsh_common_status_doorstate`}}getCardSize(){return 3}_renderZone2(t){if("error"===t||"actionrequired"===t)return q`
        <div class="zone-icon">
          <span class="warning-icon">⚠</span>
        </div>
      `;if("inactive"===t||"finished"===t||"aborting"===t)return q`<div class="zone-icon"></div>`;const e=this.hass.states[this._config.active_program_entity]?.state??"",i=function(t,e){const i=ut[t];return i?`${e}/images/${i}`:null}(e,this._resourcesPath),s=ft[e]??"";if(!i)return q`<div class="zone-icon"></div>`;return q`
      <div class="zone-icon">
        <img
          class="program-icon ${"pause"===t?"tint-amber":"tint-green"}"
          src="${i}"
          alt="${s}"
        />
        <span class="program-label">${s}</span>
      </div>
    `}_getTimerInfo(t){if("inactive"===t||"finished"===t||"aborting"===t||"error"===t||"actionrequired"===t)return{display:"--:--",label:"",colorClass:"dim"};const e=function(t){const e=new Date(t).getTime();if(isNaN(e))return null;const i=Math.floor((e-Date.now())/1e3);return i>0?i:null}(this.hass.states[this._config.remaining_time_entity]?.state??"");if(null!==e)return{display:_t(e),label:"pause"===t?"paused":"remaining",colorClass:"green"};return{display:mt(this.hass.states[this._config.elapsed_time_entity]?.state??""),label:"pause"===t?"paused":"elapsed",colorClass:"pause"===t?"amber":"green"}}_renderTopBar(t){this._tick;const e=this._getTimerInfo(t);return q`
      <div class="top-bar">
        <div class="top-bar-left">
          <!-- icon slots — to be added -->
        </div>
        <div class="top-bar-right">
          <span class="top-timer ${e.colorClass}">${e.display}</span>
          ${e.label?q`<span class="top-timer-label">${e.label}</span>`:G}
        </div>
      </div>
    `}_renderSetpoint(t){if(!("run"===t||"pause"===t))return q`<div class="zone-setpoint"></div>`;const e=this.hass.states[this._config.setpoint_temp_entity]?.state,i=e&&"unavailable"!==e&&"unknown"!==e?e:null;return q`
      <div class="zone-setpoint">
        ${i?q`<span class="setpoint-value">${i}°C</span>`:G}
      </div>
    `}_renderDetails(t){if(!function(t){return vt.includes(t)}(t))return G;const e=this.hass.states[this._config.cavity_temp_entity]?.state,i=$t(this.hass,this._config),s=this.hass.states[this._config.door_entity]?.state,n=e&&"unavailable"!==e&&"unknown"!==e?e:null,o="on"===s?"open":"off"===s?"closed":null;return q`
      <div class="details-row">
        ${n?q`<span class="detail-item">${n}°C actual</span>`:G}
        ${null!==i?q`<span class="detail-item">${i}%</span>`:G}
        ${o?q`<span class="detail-item">door ${o}</span>`:G}
      </div>
    `}_renderProgressBar(t){if(!function(t,e,i){return!!vt.includes(i)&&null!==$t(t,e)}(this.hass,this._config,t))return G;const e=$t(this.hass,this._config);return q`
      <div
        class="progress-bar ${"pause"===t?"bar-run bar-paused":"bar-run"}"
        style="width: ${e}%"
        role="progressbar"
        aria-valuenow="${e}"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    `}connectedCallback(){super.connectedCallback(),this._tickInterval=setInterval(()=>{this._tick++},3e4)}disconnectedCallback(){super.disconnectedCallback(),clearInterval(this._tickInterval)}render(){if(!this._config||!this.hass)return G;if(!this.shadowRoot.querySelector("style[data-font]")){const t=document.createElement("style");t.setAttribute("data-font",""),t.textContent=`@font-face { font-family: 'BoschSerif'; src: url('${this._resourcesPath}/fonts/BoschSerif-Regular.woff') format('woff'); }`,this.shadowRoot.appendChild(t)}const t=function(t,e){const i=(t.states[e.operation_state_entity]?.state??"").split(".");return(i[i.length-1]?.toLowerCase()??"")||"inactive"}(this.hass,this._config);return q`
      <ha-card>
        <div class="card-main">
          <div class="zone-image">
            <img
              src="${this._resourcesPath}/images/oven-bg.png"
              alt="${this._config.name??"Oven"}"
            />
          </div>
          <div class="right-panel">
            ${this._renderTopBar(t)}
            <div class="main-row">
              ${this._renderZone2(t)}
              ${this._renderSetpoint(t)}
            </div>
            <div class="bottom-bar">
              ${this._renderProgressBar(t)}
            </div>
          </div>
        </div>
        ${this._renderDetails(t)}
      </ha-card>
    `}static{this.styles=r`
    :host {
      display: block;
    }

    ha-card {
      overflow: hidden;
      padding: 0;
      background: #0e0e0e;
    }

    /* ── Main card area ── */

    .card-main {
      position: relative;
      height: 180px;
    }

    .zone-image {
      position: absolute;
      inset: 0;
    }

    .zone-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .right-panel {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 55%;
      display: flex;
      flex-direction: column;
    }

    /* ── Top bar ── */

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      height: 30px;
      flex-shrink: 0;
      border-bottom: 2px solid #009fe3;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .top-bar-right {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .top-timer {
      font-family: 'BoschSerif', sans-serif;
      font-size: 15px;
      letter-spacing: 0.5px;
    }

    .top-timer.green { color: #fff; }
    .top-timer.amber { color: #f4a427; }
    .top-timer.dim   { color: #555; }

    .top-timer-label {
      font-family: 'BoschSerif', sans-serif;
      font-size: 9px;
      color: #777;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Main content row ── */

    .main-row {
      display: flex;
      flex: 1;
      align-items: center;
    }

    .zone-icon {
      flex: 0 0 55%;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      padding: 0 14px;
      overflow: hidden;
    }

    .program-icon {
      width: 56px;
      height: 56px;
      flex-shrink: 0;
      image-rendering: crisp-edges;
    }

    .program-icon.tint-green {
      filter: drop-shadow(0 0 6px rgba(0, 159, 227, 0.6));
    }

    .program-icon.tint-amber {
      filter: drop-shadow(0 0 6px rgba(244, 164, 39, 0.6));
    }

    .program-label {
      font-family: 'BoschSerif', sans-serif;
      font-size: 12px;
      color: #fff;
      line-height: 1.3;
    }

    .warning-icon {
      font-size: 28px;
      color: #f44;
    }

    .zone-setpoint {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 8px;
    }

    .setpoint-value {
      font-family: 'BoschSerif', sans-serif;
      font-size: 34px;
      color: #fff;
      letter-spacing: 0.5px;
    }

    /* ── Bottom bar ── */

    .bottom-bar {
      position: relative;
      height: 20px;
      flex-shrink: 0;
      border-bottom: 2px solid #009fe3;
      overflow: hidden;
    }

    .progress-bar {
      position: absolute;
      inset: 0;
      transition: width 0.5s ease;
    }

    .bar-run {
      background: rgba(0, 159, 227, 0.2);
    }

    .bar-paused {
      opacity: 0.5;
    }

    /* ── Details row ── */

    .details-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 4px 20px;
      padding: 8px 16px;
      background: #111;
      border-top: 1px solid #1a1a1a;
    }

    .detail-item {
      font-family: 'BoschSerif', sans-serif;
      font-size: 12px;
      color: #aaa;
    }
  `}};t([pt({attribute:!1})],At.prototype,"hass",void 0),t([gt()],At.prototype,"_config",void 0),t([gt()],At.prototype,"_tick",void 0),At=t([ct("siemens-oven-card")],At);export{At as SiemensOvenCard};

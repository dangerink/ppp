/** @decorator */

import { WidgetWithInstrument } from './widget-with-instrument.js';
import { ref } from './element/templating/ref.js';
import { observable } from './element/observation/observable.js';
import { html, requireComponent } from './template.js';
import { when } from './element/templating/when.js';
import { validate } from './validate.js';
import { WIDGET_TYPES, TRADER_DATUM } from './const.js';
import {
  formatRelativeChange,
  formatAbsoluteChange,
  formatAmount,
  formatPrice,
  priceCurrencySymbol,
  formatPriceWithoutCurrency
} from './intl.js';
import ppp from '../ppp.js';

await Promise.all([
  requireComponent('ppp-widget-tabs'),
  requireComponent(
    'ppp-widget-tab',
    `${ppp.rootUrl}/${ppp.appType}/${ppp.theme}/widget-tabs.js`
  ),
  requireComponent(
    'ppp-widget-tab-panel',
    `${ppp.rootUrl}/${ppp.appType}/${ppp.theme}/widget-tabs.js`
  )
]);

export const orderWidgetTemplate = (context, definition) => html`
  <template>
    <div class="widget-root">
      <div class="widget-header">
        <div class="widget-instrument-area">
          <${'ppp-widget-group-control'}
            :widget="${(x) => x}"
            selection="${(x) => x.document?.group}"
            ${ref('groupControl')}
          ></ppp-widget-group-control>
          <div class="instrument-search-holder">
            <${'ppp-widget-search-control'}
              :widget="${(x) => x}"
              ${ref('searchControl')}
            ></ppp-widget-search-control>
          </div>
          <div class="instrument-quote-line">
            ${when(
              (x) => x.instrument,
              html`
                <span
                  class="price ${(x) =>
                    x.lastPriceAbsoluteChange < 0 ? 'negative' : 'positive'}"
                >
                  ${(x) => x.formatPrice(x.lastPrice)}
                </span>
                <span
                  class="${(x) =>
                    x.lastPriceAbsoluteChange < 0 ? 'negative' : 'positive'}"
                >
                  ${(x) =>
                    formatAbsoluteChange(
                      x.lastPriceAbsoluteChange,
                      x.instrument
                    )}
                </span>
                <span
                  class="${(x) =>
                    x.lastPriceAbsoluteChange < 0 ? 'negative' : 'positive'}"
                >
                  ${(x) =>
                    formatRelativeChange(x.lastPriceRelativeChange / 100)}
                </span>
              `
            )}
          </div>
          <div class="widget-header-controls">
            <img
              draggable="false"
              alt="Закрыть"
              class="widget-close-button"
              src="static/widgets/close.svg"
              @click="${(x) => x.close()}"
            />
          </div>
        </div>
      </div>
      <div class="widget-body">
        ${when(
          (x) => x.instrument,
          html`
            <ppp-widget-tabs
              activeid="${(x) => x.getActiveWidgetTab()}"
              @change="${(x, c) => x.handleWidgetTabChange(c)}"
              ${ref('orderTypeTabs')}
            >
              <ppp-widget-tab id="market">Рыночная</ppp-widget-tab>
              <ppp-widget-tab id="limit">Лимитная</ppp-widget-tab>
              <ppp-widget-tab id="stop" disabled>Отложенная</ppp-widget-tab>
              <ppp-widget-tab-panel id="market-panel"></ppp-widget-tab-panel>
              <ppp-widget-tab-panel id="limit-panel"></ppp-widget-tab-panel>
              <ppp-widget-tab-panel id="stop-panel"></ppp-widget-tab-panel>
            </ppp-widget-tabs>
            <div style="height: 100%">
              <div class="widget-company-card">
                <div class="widget-company-card-item">
                  <span
                    title="${(x) => x.instrument?.fullName}"
                    class="company-name">${(x) => x.instrument?.fullName}</span>
                  <span
                    @click="${(x) => x.setPrice(x.lastPrice)}"
                    class="company-last-price ${(x) =>
                      x.lastPriceAbsoluteChange < 0 ? 'negative' : 'positive'}"
                  >
                    ${(x) => x.formatPrice(x.lastPrice)}
                  </span>
                </div>
                <div class="widget-company-card-item">
                  <span>В портфеле: ${(x) => x.formatPositionSize()}</span>
                  <span>Средняя: ${(x) =>
                    x.formatPrice(x.positionAverage ?? 0)}</span>
                </div>
              </div>
              <div class="widget-nbbo-line">
                <div class="widget-nbbo-line-bid"
                     @click="${(x) => x.setPrice(x.bestBid)}"
                >
                  Bid ${(x) => x.formatPrice(x.bestBid)}
                  <div class="widget-nbbo-line-icon-holder">
                    <div class="widget-nbbo-line-icon-fallback">
                      <div
                        class="widget-nbbo-line-icon-logo"
                        style="${(x) =>
                          `background-image:url(${
                            'static/instruments/' + x.instrument?.isin + '.svg'
                          })`}"
                      ></div>
                      ${(x) => x.instrument?.fullName[0]}
                    </div>
                  </div>
                </div>
                <div class="widget-nbbo-line-ask"
                     @click="${(x) => x.setPrice(x.bestAsk)}"
                >
                  Ask ${(x) => x.formatPrice(x.bestAsk)}
                </div>
              </div>
              <div class="widget-section">
                <div class="widget-subsection">
                  <div class="widget-subsection-item">
                    <div class="widget-text-label">Цена исполнения</div>
                    <div class="widget-flex-line">
                      <${'ppp-widget-text-field'}
                        ${ref('price')}
                        ?disabled="${(x) =>
                          x.orderTypeTabs.activeid === 'market'}"
                        maxlength="12"
                        @input="${(x, c) => x.handlePriceInput(c)}"
                        @keydown="${(x, c) => x.handlePriceKeydown(c)}"
                      >
                        <span slot="end">${(x) =>
                          priceCurrencySymbol(x.instrument)}</span>
                      </ppp-widget-text-field>
                      ${when(
                        (x) => x.orderTypeTabs.activeid === 'market',
                        html`
                          <${'ppp-widget-text-field'}
                            class="price-placeholder"
                            disabled
                            placeholder="Рыночная"
                          >
                          </ppp-widget-text-field>
                        `
                      )}
                    </div>
                  </div>
                  <div class="widget-subsection-item">
                    <div class="widget-text-label">Количество</div>
                    <div class="widget-flex-line">
                      <${'ppp-widget-text-field'}
                        ${ref('quantity')}
                        maxlength="8"
                        @keydown="${(x, c) => x.handleQuantityKeydown(c)}"
                        @input="${(x, c) => x.handleQuantityInput(c)}"
                        class="${(x) =>
                          'lot-size-' + x.instrument?.lot?.toString()?.length ??
                          1}"
                      >
                        <span slot="end">${(x) =>
                          x.instrument?.lot
                            ? '×' + x.instrument.lot
                            : ''}</span>
                      </ppp-widget-text-field>
                    </div>
                  </div>
                </div>
              </div>
              <div class="widget-margin-spacer"></div>
              <div class="widget-section">
                <div class="widget-summary">
                  <div class="widget-summary-line">
                    <span>Стоимость</span>
                    <span class="widget-summary-line-price">
                      ${(x) =>
                        x.orderTypeTabs.activeid === 'market'
                          ? 'по факту сделки'
                          : formatAmount(x.totalAmount, x.instrument?.currency)}
                    </span>
                  </div>
                  <div class="widget-summary-line">
                    <span>Комиссия</span>
                    <span>${(x) =>
                      x.orderTypeTabs.activeid === 'market'
                        ? 'по факту сделки'
                        : x.formatPrice(x.commission)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="widget-footer">
              <div class="widget-section">
                <div class="widget-subsection">
                  <div class="widget-summary">
                    <div class="widget-summary-line">
                      <span>Доступно</span>
                      <span class="positive">
                        ${(x) => x.formatPrice(x.buyingPowerQuantity)}
                      </span>
                    </div>
                    <div class="widget-summary-line">
                      <span>С плечом</span>
                      <span class="positive">
                        ${(x) => x.formatPrice(x.marginBuyingPowerQuantity)}
                      </span>
                    </div>
                  </div>
                  <div class="widget-summary">
                    <div class="widget-summary-line">
                      <span>Доступно</span>
                      <span class="negative">
                        ${(x) => x.formatPrice(x.sellingPowerQuantity)}
                      </span>
                    </div>
                    <div class="widget-summary-line">
                      <span>С плечом</span>
                      <span class="negative">
                        ${(x) => x.formatPrice(x.marginSellingPowerQuantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="widget-section-spacer"></div>
              <div class="widget-section">
                <div class="widget-subsection">
                  <${'ppp-widget-button'}
                    appearance="success"
                    @click="${(x) => x.buyOrSell('buy')}"
                  >
                    Покупка
                  </ppp-widget-button>
                  <${'ppp-widget-button'}
                    appearance="danger"
                    @click="${(x) => x.buyOrSell('sell')}"
                  >
                    Продажа
                  </ppp-widget-button>
                </div>
              </div>
            </div>
            <div class="widget-notifications-area">
              <div class="widget-notification-ps">
                <div class="widget-notification-holder">
                  ${when(
                    (x) => x.notificationVisible && x.notificationTitle,
                    html`
                      <div
                        class="widget-notification"
                        status="${(x) => x.notificationStatus ?? 'success'}"
                      >
                        <div class="widget-notification-icon">
                          <img
                            draggable="false"
                            alt="Ошибка"
                            src="${(x) =>
                              `static/widgets/notifications-${
                                x.notificationStatus ?? 'success'
                              }.svg`}"
                          />
                        </div>
                        <div class="widget-notification-text-container">
                          <div class="widget-notification-title">
                            ${(x) => x.notificationTitle ?? ''}
                          </div>
                          <div class="widget-notification-text">
                            ${(x) => x.notificationText ?? ''}
                          </div>
                        </div>
                        <div
                          class="widget-notification-close-button"
                          @click="${(x) => (x.notificationVisible = false)}"
                        >
                          <img
                            draggable="false"
                            alt="Закрыть"
                            src="static/widgets/close.svg"
                          />
                        </div>
                      </div>
                    `
                  )}
                </div>
              </div>
            </div>
          `
        )}
        ${when(
          (x) => !x.instrument,
          html`
            <div class="widget-empty-state-holder">
              <img draggable="false" src="static/empty-widget-state.svg" />
              <span>Выберите инструмент.</span>
            </div>
          `
        )}
      </div>
    </div>
  </template>
`;

export class PppOrderWidget extends WidgetWithInstrument {
  @observable
  ordersTrader;

  @observable
  level1Trader;

  @observable
  lastPrice;

  @observable
  lastPriceAbsoluteChange;

  @observable
  lastPriceRelativeChange;

  @observable
  bestBid;

  @observable
  bestAsk;

  @observable
  totalAmount;

  @observable
  commission;

  @observable
  buyingPowerQuantity;

  @observable
  marginBuyingPowerQuantity;

  @observable
  sellingPowerQuantity;

  @observable
  marginSellingPowerQuantity;

  @observable
  positionSize;

  @observable
  positionAverage;

  async connectedCallback() {
    super.connectedCallback();

    this.ordersTrader = await ppp.getOrCreateTrader(this.document.ordersTrader);
    this.level1Trader = await ppp.getOrCreateTrader(this.document.level1Trader);

    this.searchControl.trader = this.ordersTrader;

    if (this.level1Trader) {
      await this.level1Trader.subscribeFields?.({
        source: this,
        fieldDatumPairs: {
          lastPrice: TRADER_DATUM.LAST_PRICE,
          lastPriceRelativeChange: TRADER_DATUM.LAST_PRICE_RELATIVE_CHANGE,
          lastPriceAbsoluteChange: TRADER_DATUM.LAST_PRICE_ABSOLUTE_CHANGE,
          bestBid: TRADER_DATUM.BEST_BID,
          bestAsk: TRADER_DATUM.BEST_ASK,
          positionSize: TRADER_DATUM.POSITION_SIZE,
          positionAverage: TRADER_DATUM.POSITION_AVERAGE
        }
      });
    }
  }

  async disconnectedCallback() {
    if (this.level1Trader) {
      await this.level1Trader.unsubscribeFields?.({
        source: this,
        fieldDatumPairs: {
          lastPrice: TRADER_DATUM.LAST_PRICE,
          lastPriceRelativeChange: TRADER_DATUM.LAST_PRICE_RELATIVE_CHANGE,
          lastPriceAbsoluteChange: TRADER_DATUM.LAST_PRICE_ABSOLUTE_CHANGE,
          bestBid: TRADER_DATUM.BEST_BID,
          bestAsk: TRADER_DATUM.BEST_ASK,
          positionSize: TRADER_DATUM.POSITION_SIZE,
          positionAverage: TRADER_DATUM.POSITION_AVERAGE
        }
      });
    }

    super.disconnectedCallback();
  }

  instrumentChanged(oldValue, newValue) {
    super.instrumentChanged(oldValue, newValue);

    this.level1Trader?.instrumentChanged?.(this, oldValue, newValue);
  }

  async validate() {
    await validate(this.container.ordersTraderId);
    await validate(this.container.level1TraderId);
  }

  async update() {
    return {
      $set: {
        ordersTraderId: this.container.ordersTraderId.value,
        level1TraderId: this.container.level1TraderId.value,
        displaySizeInUnits: this.container.displaySizeInUnits.checked
      }
    };
  }

  getActiveWidgetTab() {
    if (/market|limit/i.test(this.document.activeTab))
      return this.document.activeTab;
    else return 'limit';
  }

  handleWidgetTabChange({ event }) {
    void this.applyChanges({
      $set: {
        'widgets.$.activeTab': event.detail.id
      }
    });
  }

  formatPrice(price) {
    return formatPrice(price, this.instrument);
  }

  setPrice(price) {
    if (price > 0) {
      this.price.value = price.toString().replace('.', ',');

      this.calculateTotalAmount();
      this.price.focus();
    }
  }

  formatPositionSize() {
    let size = 0;
    let suffix = this.document.displaySizeInUnits ? 'шт.' : 'л.';

    if (this.instrument) {
      size = this.positionSize ?? 0;

      if (this.document.displaySizeInUnits) size *= this.instrument.lot ?? 1;
    }

    return `${size} ${suffix}`;
  }

  async buyOrSell(direction) {
    if (!this.ordersTrader) {
      return this.error({
        title: 'Ошибка заявки',
        text: 'Отсутствует трейдер для выставления заявок.'
      });
    }

    this.topLoader.start();

    try {
      if (this.orderTypeTabs.activeid === 'limit') {
        await this.ordersTrader.placeLimitOrder({
          instrument: this.instrument,
          price: this.price.value,
          quantity: this.quantity.value,
          direction
        });
      } else if (this.orderTypeTabs.activeid === 'market') {
        await this.ordersTrader.placeMarketOrder({
          instrument: this.instrument,
          quantity: this.quantity.value,
          direction
        });
      }

      return this.success({
        title: 'Заявка выставлена'
      });
    } catch (e) {
      console.log(e);

      return this.error({
        title: 'Заявка не выставлена',
        text: await this.ordersTrader?.formatError?.(this.instrument, e)
      });
    } finally {
      this.topLoader.stop();
    }
  }
}

export async function widgetDefinition(definition = {}) {
  await requireComponent('ppp-collection-select');

  return {
    type: WIDGET_TYPES.ORDER,
    collection: 'PPP',
    title: html`Заявка`,
    description: html`Виджет <span class="positive">Заявка</span> используется,
      чтобы выставлять рыночные, лимитные и отложенные биржевые заявки.`,
    customElement: PppOrderWidget.compose(definition),
    maxHeight: 512,
    maxWidth: 512,
    minHeight: 375,
    minWidth: 275,
    settings: html`
      <div class="widget-settings-section">
        <div class="widget-settings-label-group">
          <h5>Трейдер заявок</h5>
          <p>
            Трейдер, который будет выставлять зявки, а также фильтровать
            инструменты в поиске.
          </p>
        </div>
        <ppp-collection-select
          ${ref('ordersTraderId')}
          value="${(x) => x.document.ordersTraderId}"
          :context="${(x) => x}"
          :preloaded="${(x) => x.document.ordersTrader ?? ''}"
          :query="${() => {
            return (context) => {
              return context.services
                .get('mongodb-atlas')
                .db('ppp')
                .collection('traders')
                .find({
                  $or: [
                    { removed: { $ne: true } },
                    { _id: `[%#this.document.ordersTraderId ?? ''%]` }
                  ]
                })
                .sort({ updatedAt: -1 });
            };
          }}"
          :transform="${() => ppp.decryptDocumentsTransformation()}"
        ></ppp-collection-select>
      </div>
      <div class="widget-settings-section">
        <div class="widget-settings-label-group">
          <h5>Трейдер L1</h5>
          <p>Трейдер, выступающий источником L1-данных виджета.</p>
        </div>
        <ppp-collection-select
          ${ref('level1TraderId')}
          value="${(x) => x.document.level1TraderId}"
          :context="${(x) => x}"
          :preloaded="${(x) => x.document.level1Trader ?? ''}"
          :query="${() => {
            return (context) => {
              return context.services
                .get('mongodb-atlas')
                .db('ppp')
                .collection('traders')
                .find({
                  $or: [
                    { removed: { $ne: true } },
                    { _id: `[%#this.document.level1TraderId ?? ''%]` }
                  ]
                })
                .sort({ updatedAt: -1 });
            };
          }}"
          :transform="${() => ppp.decryptDocumentsTransformation()}"
        ></ppp-collection-select>
      </div>
      <div class="widget-settings-section">
        <div class="widget-settings-label-group">
          <h5>Параметры отображения</h5>
        </div>
        <${'ppp-checkbox'}
          ?checked="${(x) => x.document.displaySizeInUnits}"
          ${ref('displaySizeInUnits')}
        >
          Показывать количество инструмента в портфеле в штуках
        </${'ppp-checkbox'}>
      </div>
    `
  };
}

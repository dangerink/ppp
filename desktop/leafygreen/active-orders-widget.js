import { css } from '../../shared/element/styles/css.js';
import { widgetStyles } from './widget.js';
import {
  activeOrdersWidgetTemplate,
  widgetDefinition as baseWidgetDefinition
} from '../../shared/active-orders-widget.js';

// noinspection JSUnusedGlobalSymbols
export async function widgetDefinition({ ppp, baseWidgetUrl }) {
  const activeOrdersWidgetStyles = (context, definition) => css`
    ${widgetStyles}
  `;

  return baseWidgetDefinition({
    template: activeOrdersWidgetTemplate,
    styles: activeOrdersWidgetStyles,
    shadowOptions: null
  });
}

import { cyrillicToLatin } from '../intl.js';
import ppp from '../../ppp.js';

/**
 * @mixin
 */
export class TraderWithSimpleSearch {
  async search(searchText) {
    if (searchText?.trim()) {
      searchText = searchText.trim();

      const lines = ((context) => {
        const collection = context.services
          .get('mongodb-atlas')
          .db('ppp')
          .collection('instruments');

        const exactSymbolMatch = collection
          .find({
            $and: [
              {
                exchange: '$exchange'
              },
              {
                $or: [
                  {
                    symbol: '$text'
                  },
                  {
                    symbol: '$latin'
                  }
                ]
              }
            ]
          })
          .limit(1);

        const regexSymbolMatch = collection
          .find({
            $and: [
              {
                exchange: '$exchange'
              },
              {
                symbol: { $regex: '(^$text|^$latin)', $options: 'i' }
              }
            ]
          })
          .limit(20);

        const regexFullNameMatch = collection
          .find({
            $and: [
              {
                exchange: '$exchange'
              },
              {
                fullName: { $regex: '($text|$latin)', $options: 'i' }
              }
            ]
          })
          .limit(20);

        return { exactSymbolMatch, regexSymbolMatch, regexFullNameMatch };
      })
        .toString()
        .split(/\r?\n/);

      lines.pop();
      lines.shift();

      return ppp.user.functions.eval(
        lines
          .join('\n')
          .replaceAll('$exchange', this.getExchange?.() ?? '')
          .replaceAll('$text', searchText.toUpperCase())
          .replaceAll('$latin', cyrillicToLatin(searchText).toUpperCase())
      );
    }
  }
}

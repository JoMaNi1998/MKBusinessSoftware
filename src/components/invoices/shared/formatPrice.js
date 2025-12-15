/**
 * Invoice-spezifische Preisformatierung
 * Nutzt die globale formatPrice und fügt € hinzu
 */
import { formatPrice as baseFormatPrice } from '../../../utils';

export const formatPrice = (price) => {
  const formatted = baseFormatPrice(price);
  return formatted ? `${formatted} €` : '0,00 €';
};

export default formatPrice;

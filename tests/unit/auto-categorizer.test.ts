import { describe, expect, it } from 'vitest';

import { getFlattenedCategoryOptions } from '../../src/config/categories.config';
import { autoCategorizeProduct } from '../../src/shared/utils/auto-categorizer';

describe('Auto-Categorizer Production-Level Test Suite', () => {
  const flattenedCategories = getFlattenedCategoryOptions();
  const validCategoryIds = new Set(flattenedCategories.map((c: { id: string }) => c.id));

  const verifyAllIdsValid = (categoryIds: string[]) => {
    categoryIds.forEach((id) => {
      expect(
        validCategoryIds.has(id),
        `Category ID "${id}" is NOT in canonical CATEGORY_TAXONOMY!`,
      ).toBe(true);
    });
  };

  it('correctly categorizes Women Panties & Innerwear', () => {
    const res = autoCategorizeProduct({
      name: 'Women Seamless Cotton Panties Pack of 3',
    });
    expect(res.categoryIds).toContain('cat_women_panties');
    expect(res.categoryIds).toContain('cat_women_innerwear');
    expect(res.departmentGroup).toBe('group_women');
    expect(res.suggestedProductType).toBe('women_panties');
    verifyAllIdsValid(res.categoryIds);
  });

  it('correctly categorizes Women Bras & Lingerie', () => {
    const braRes = autoCategorizeProduct({
      name: 'Seamless Padded T-Shirt Bra for Women',
    });
    expect(braRes.categoryIds).toContain('cat_women_bras');
    expect(braRes.categoryIds).toContain('cat_women_innerwear');
    expect(braRes.suggestedProductType).toBe('women_bras');
    verifyAllIdsValid(braRes.categoryIds);

    const lingerieRes = autoCategorizeProduct({
      name: 'Lace Babydoll Lingerie Set',
    });
    expect(lingerieRes.categoryIds).toContain('cat_women_lingerie');
    expect(lingerieRes.categoryIds).toContain('cat_women_innerwear');
    verifyAllIdsValid(lingerieRes.categoryIds);
  });

  it('correctly categorizes Women Camisoles & Shapewear', () => {
    const camiRes = autoCategorizeProduct({
      name: 'Women Pure Cotton Camisole Tank Slip',
    });
    expect(camiRes.categoryIds).toContain('cat_women_camisoles');
    expect(camiRes.suggestedProductType).toBe('women_camisoles');
    verifyAllIdsValid(camiRes.categoryIds);

    const shapeRes = autoCategorizeProduct({
      name: 'High Waist Tummy Tucker Body Shaper Shapewear',
    });
    expect(shapeRes.categoryIds).toContain('cat_women_shapewear');
    expect(shapeRes.categoryIds).toContain('cat_women_shapewear_sec');
    expect(shapeRes.suggestedProductType).toBe('women_shapewear');
    verifyAllIdsValid(shapeRes.categoryIds);
  });

  it('correctly categorizes Winter Essentials Thermals', () => {
    const womenThermal = autoCategorizeProduct({
      name: 'Women Winter Thermal Tops & Bottoms Set',
    });
    expect(womenThermal.categoryIds).toContain('cat_women_thermals');
    expect(womenThermal.categoryIds).toContain('cat_women_winter_essentials');
    expect(womenThermal.departmentGroup).toBe('group_women');
    verifyAllIdsValid(womenThermal.categoryIds);

    const menThermal = autoCategorizeProduct({
      name: "Men's Body Warmer Thermal Innerwear Set",
    });
    expect(menThermal.categoryIds).toContain('cat_men_thermals');
    expect(menThermal.categoryIds).toContain('cat_men_winter_essentials');
    expect(menThermal.departmentGroup).toBe('group_men');
    verifyAllIdsValid(menThermal.categoryIds);
  });

  it('correctly categorizes Loungewear & Night Suits', () => {
    const loungeRes = autoCategorizeProduct({
      name: 'Women Cotton Loungewear Set & Comfort Wear',
    });
    expect(loungeRes.categoryIds).toContain('cat_women_lounge_sets');
    expect(loungeRes.categoryIds).toContain('cat_women_comfort_wear');
    expect(loungeRes.suggestedProductType).toBe('women_sleepwear');
    verifyAllIdsValid(loungeRes.categoryIds);

    const nightSuitRes = autoCategorizeProduct({
      name: 'Women Floral Print Night Suit Pyjama Set',
    });
    expect(nightSuitRes.categoryIds).toContain('cat_women_night_suits');
    expect(nightSuitRes.categoryIds).toContain('cat_women_sleepwear');
    verifyAllIdsValid(nightSuitRes.categoryIds);
  });

  it('correctly categorizes Traditional Indian Sarees & Lehengas', () => {
    const sareeRes = autoCategorizeProduct({
      name: 'Royal Blue Banarasi Silk Saree with Zari Border',
    });
    expect(sareeRes.categoryIds).toContain('cat_women_sarees');
    expect(sareeRes.categoryIds).toContain('cat_women_indian_wear');
    expect(sareeRes.suggestedProductType).toBe('women_sarees');
    verifyAllIdsValid(sareeRes.categoryIds);

    const lehengaRes = autoCategorizeProduct({
      name: 'Bridal Lehenga Choli with Embroidered Dupatta',
    });
    expect(lehengaRes.categoryIds).toContain('cat_women_lehengas');
    expect(lehengaRes.categoryIds).toContain('cat_women_indian_wear');
    expect(lehengaRes.suggestedProductType).toBe('women_lehengas');
    verifyAllIdsValid(lehengaRes.categoryIds);
  });

  it('correctly categorizes Men Topwear & Bottomwear', () => {
    const shirtRes = autoCategorizeProduct({
      name: 'Men 100% Cotton Casual Slim Fit Shirt',
    });
    expect(shirtRes.categoryIds).toContain('cat_men_shirts');
    expect(shirtRes.categoryIds).toContain('cat_men_topwear');
    expect(shirtRes.departmentGroup).toBe('group_men');
    expect(shirtRes.suggestedProductType).toBe('men_shirts');
    verifyAllIdsValid(shirtRes.categoryIds);

    const jeansRes = autoCategorizeProduct({
      name: 'Men Slim Fit Stretchable Denim Jeans',
    });
    expect(jeansRes.categoryIds).toContain('cat_men_jeans');
    expect(jeansRes.categoryIds).toContain('cat_men_bottomwear');
    expect(jeansRes.suggestedProductType).toBe('men_jeans');
    verifyAllIdsValid(jeansRes.categoryIds);
  });

  it('never returns top-level group IDs as product category IDs', () => {
    const testCases = [
      'Men Denim Jeans',
      'Women Silk Saree',
      'Kids Baby Romper',
      'Casual Cotton T-Shirt',
    ];
    testCases.forEach((name) => {
      const res = autoCategorizeProduct({ name });
      expect(res.categoryIds).not.toContain('group_men');
      expect(res.categoryIds).not.toContain('group_women');
      expect(res.categoryIds).not.toContain('group_kids');
      expect(res.categoryIds).not.toContain('group_spotlight');
      expect(res.categoryIds).not.toContain('group_shops');
      verifyAllIdsValid(res.categoryIds);
    });
  });

  it('strictly respects explicit user-selected department (Men vs Women vs Kids)', () => {
    // 1. User selected Men and typed "Cotton Casual T-Shirt"
    const menRes = autoCategorizeProduct({
      name: 'Cotton Casual T-Shirt',
      gender: 'men',
    });
    expect(menRes.departmentGroup).toBe('group_men');
    expect(menRes.suggestedProductType).toBe('men_tshirts');
    expect(menRes.categoryIds).toContain('cat_men_tshirts');
    expect(menRes.categoryIds).toContain('cat_men_topwear');
    verifyAllIdsValid(menRes.categoryIds);

    // 2. User selected Kids and typed "Cotton Casual T-Shirt"
    const kidsRes = autoCategorizeProduct({
      name: 'Cotton Casual T-Shirt',
      gender: 'kids',
    });
    expect(kidsRes.departmentGroup).toBe('group_kids');
    expect(kidsRes.categoryIds).toContain('cat_kids_all_fashion');
    verifyAllIdsValid(kidsRes.categoryIds);

    // 3. User selected Women and typed "Cotton Casual T-Shirt"
    const womenRes = autoCategorizeProduct({
      name: 'Cotton Casual T-Shirt',
      gender: 'women',
    });
    expect(womenRes.departmentGroup).toBe('group_women');
    expect(womenRes.suggestedProductType).toBe('women_tops_tees');
    expect(womenRes.categoryIds).toContain('cat_women_tops_tees');
    verifyAllIdsValid(womenRes.categoryIds);
  });

  it('correctly categorizes Men and Women Footwear with proper HSN codes', () => {
    // 1. Men Casual Sneaker
    const sneakerRes = autoCategorizeProduct({
      name: 'Men White Air Mesh Sneaker Casual Shoes',
      price: 1499,
    });
    expect(sneakerRes.categoryIds).toContain('cat_fw_men_casual');
    expect(sneakerRes.departmentGroup).toBe('group_footwear');
    expect(sneakerRes.suggestedProductType).toBe('men_footwear_general');
    expect(sneakerRes.extractedAttributes?.suggestedHsnCode).toBe('6404');
    expect(sneakerRes.extractedAttributes?.suggestedGstRate).toBe(12);
    verifyAllIdsValid(sneakerRes.categoryIds);

    // 2. Women Ethnic Jutti
    const juttiRes = autoCategorizeProduct({
      name: 'Women Handcrafted Golden Embroidered Punjabi Jutti',
      price: 799,
    });
    expect(juttiRes.categoryIds).toContain('cat_fw_women_juttis');
    expect(juttiRes.departmentGroup).toBe('group_footwear');
    expect(juttiRes.suggestedProductType).toBe('women_footwear_general');
    expect(juttiRes.extractedAttributes?.suggestedHsnCode).toBe('6404');
    expect(juttiRes.extractedAttributes?.suggestedGstRate).toBe(5);
    verifyAllIdsValid(juttiRes.categoryIds);

    // 3. Women Heels
    const heelsRes = autoCategorizeProduct({
      name: 'Women Stylish Block Heels Sandal',
      price: 1899,
    });
    expect(heelsRes.categoryIds).toContain('cat_fw_women_heels');
    expect(heelsRes.departmentGroup).toBe('group_footwear');
    verifyAllIdsValid(heelsRes.categoryIds);
  });

  it('correctly categorizes Men and Women Accessories with proper HSN codes', () => {
    // 1. Men Wallet
    const walletRes = autoCategorizeProduct({
      name: 'Men Genuine Leather Bifold Wallet with Card Slots',
      price: 999,
    });
    expect(walletRes.categoryIds).toContain('cat_men_wallets');
    expect(walletRes.departmentGroup).toBe('group_accessories');
    expect(walletRes.extractedAttributes?.suggestedHsnCode).toBe('4202');
    expect(walletRes.extractedAttributes?.suggestedGstRate).toBe(18);
    verifyAllIdsValid(walletRes.categoryIds);

    // 2. Men Belt
    const beltRes = autoCategorizeProduct({
      name: 'Men Formal Black Leather Belt with Silver Buckle',
      price: 899,
    });
    expect(beltRes.categoryIds).toContain('cat_men_belts');
    expect(beltRes.departmentGroup).toBe('group_accessories');
    expect(beltRes.extractedAttributes?.suggestedHsnCode).toBe('4203');
    expect(beltRes.extractedAttributes?.suggestedGstRate).toBe(18);
    verifyAllIdsValid(beltRes.categoryIds);

    // 3. Women Handbag
    const bagRes = autoCategorizeProduct({
      name: 'Women Designer Leather Handbag Shoulder Tote Bag',
      price: 2499,
    });
    expect(bagRes.categoryIds).toContain('cat_women_handbags');
    expect(bagRes.departmentGroup).toBe('group_accessories');
    expect(bagRes.extractedAttributes?.suggestedHsnCode).toBe('4202');
    expect(bagRes.extractedAttributes?.suggestedGstRate).toBe(18);
    verifyAllIdsValid(bagRes.categoryIds);

    // 4. Women Jewellery
    const jewelRes = autoCategorizeProduct({
      name: 'Gold Plated Traditional Kundan Choker Necklace Set with Jhumkas',
      price: 1299,
    });
    expect(jewelRes.categoryIds).toContain('cat_women_jewellery');
    expect(jewelRes.departmentGroup).toBe('group_accessories');
    expect(jewelRes.extractedAttributes?.suggestedHsnCode).toBe('7117');
    expect(jewelRes.extractedAttributes?.suggestedGstRate).toBe(3);
    verifyAllIdsValid(jewelRes.categoryIds);
  });
});

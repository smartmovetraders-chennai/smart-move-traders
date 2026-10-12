/**
 * businessController.js
 * Business profile management ensuring Smart Move Traders identity and Chennai address.
 */

const { supabase, isConfigured, mockDb } = require('../config/supabase');
const { BUSINESS_DETAILS } = require('../config/constants');

/**
 * Get business profile for current dealer.
 */
async function getProfile(req, res, next) {
  try {
    const ownerId = req.user.id;

    if (!isConfigured) {
      const existing = mockDb.businessProfile.get(ownerId);
      if (existing) {
        return res.json({ success: true, data: existing });
      }
      const defaultProfile = {
        owner_id: ownerId,
        business_name: BUSINESS_DETAILS.name,
        address_line1: BUSINESS_DETAILS.addressLine1,
        address_line2: BUSINESS_DETAILS.addressLine2,
        address_line3: BUSINESS_DETAILS.addressLine3,
        address_city: BUSINESS_DETAILS.city,
        address_pincode: BUSINESS_DETAILS.pincode,
        full_address: BUSINESS_DETAILS.fullAddress,
        gstin: null,
        phone: null,
        email: null
      };
      return res.json({ success: true, data: defaultProfile });
    }

    const { data, error } = await supabase
      .from('business_profile')
      .select('*')
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const defaultProfile = {
        owner_id: ownerId,
        business_name: BUSINESS_DETAILS.name,
        address_line1: BUSINESS_DETAILS.addressLine1,
        address_line2: BUSINESS_DETAILS.addressLine2,
        address_line3: BUSINESS_DETAILS.addressLine3,
        address_city: BUSINESS_DETAILS.city,
        address_pincode: BUSINESS_DETAILS.pincode,
        full_address: BUSINESS_DETAILS.fullAddress,
        gstin: null,
        phone: null,
        email: null
      };
      return res.json({ success: true, data: defaultProfile });
    }

    return res.json({
      success: true,
      data: {
        ...data,
        full_address: `${data.address_line1} ${data.address_line2} ${data.address_line3} ${data.address_city} - ${data.address_pincode}`
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update business profile.
 */
async function updateProfile(req, res, next) {
  try {
    const ownerId = req.user.id;
    const { gstin, phone, email, businessName } = req.body;

    const updates = {
      owner_id: ownerId,
      business_name: businessName || BUSINESS_DETAILS.name,
      address_line1: BUSINESS_DETAILS.addressLine1,
      address_line2: BUSINESS_DETAILS.addressLine2,
      address_line3: BUSINESS_DETAILS.addressLine3,
      address_city: BUSINESS_DETAILS.city,
      address_pincode: BUSINESS_DETAILS.pincode,
      gstin: gstin !== undefined ? gstin : null,
      phone: phone !== undefined ? phone : null,
      email: email !== undefined ? email : null,
      updated_at: new Date().toISOString()
    };

    if (!isConfigured) {
      mockDb.businessProfile.set(ownerId, updates);
      return res.json({ success: true, data: updates });
    }

    const { data, error } = await supabase
      .from('business_profile')
      .upsert(updates, { onConflict: 'owner_id' })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getProfile,
  updateProfile
};

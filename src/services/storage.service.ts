
import { supabase } from '../lib/supabase';

type UploadImageInput = {
  productId: string;
  buffer: Buffer;
  mimetype: string;
  originalName: string;
  imageType: 'main' | 'gallery';
};

type UploadDatasheetInput = {
  productId: string;
  buffer: Buffer;
  originalName: string;
};

// ── Images ───────────────────────────────────────────────────────────────────

export async function uploadProductImage({
  productId,
  buffer,
  mimetype,
  originalName,
  imageType,
}: UploadImageInput) {
  const ext = originalName.split('.').pop() ?? 'jpg';

  const path =
    imageType === 'main'
      ? `${productId}/main.${ext}`
      : `${productId}/gallery/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(path, buffer, {
      contentType: mimetype,
      upsert: imageType === 'main',
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data.path);

  // Persist gallery image
  if (imageType === 'gallery') {
    await supabase.from('product_images').insert({
      product_id: productId,
      storage_path: data.path,
      public_url: urlData.publicUrl,
      is_primary: false,
    });
  } else {
    // Update product main image
    await supabase
      .from('products')
      .update({
        main_image_url: urlData.publicUrl,
        main_image_path: data.path,
      })
      .eq('id', productId);
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'upload',
    entity_type: 'product_image',
    entity_id: productId,
    changes: {
      path: data.path,
      type: imageType,
    },
  });

  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

// ── Datasheets ───────────────────────────────────────────────────────────────

export async function uploadDatasheet({
  productId,
  buffer,
  originalName,
}: UploadDatasheetInput) {
  const path = `${productId}/datasheet.pdf`;

  const { data, error } = await supabase.storage
    .from('datasheets')
    .upload(path, buffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  // Save storage path
  await supabase
    .from('products')
    .update({
      datasheet_path: data.path,
    })
    .eq('id', productId);

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'upload',
    entity_type: 'product_datasheet',
    entity_id: productId,
    changes: {
      path: data.path,
    },
  });

  return {
    path: data.path,
  };
}

// ── Signed URL for datasheet download ───────────────────────────────────────

export async function getDatasheetSignedUrl(productId: string) {
  const { data: product } = await supabase
    .from('products')
    .select('datasheet_path')
    .eq('id', productId)
    .is('deleted_at', null)
    .single();

  if (!product?.datasheet_path) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from('datasheets')
    .createSignedUrl(product.datasheet_path, 3600);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

// ── Delete Product Image ────────────────────────────────────────────────────

export async function deleteProductImage(imageId: string) {
  const { data: img, error: fetchErr } = await supabase
    .from('product_images')
    .select('storage_path, product_id')
    .eq('id', imageId)
    .single();

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }

  // Remove from storage
  await supabase.storage
    .from('product-images')
    .remove([img.storage_path]);

  // Remove DB entry
  await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'delete',
    entity_type: 'product_image',
    entity_id: img.product_id,
    changes: {
      deleted_image_id: imageId,
    },
  });
}

// ── Reorder Product Images ──────────────────────────────────────────────────

export async function reorderProductImages(
  productId: string,
  updates: { id: string; sort_order: number }[],
) {
  await Promise.all(
    updates.map(({ id, sort_order }) =>
      supabase
        .from('product_images')
        .update({ sort_order })
        .eq('id', id)
        .eq('product_id', productId)
    )
  );
}

// ── Set Primary Product Image ───────────────────────────────────────────────

export async function setPrimaryImage(imageId: string) {
  const { data: img, error: fetchErr } = await supabase
    .from('product_images')
    .select('product_id, public_url, storage_path')
    .eq('id', imageId)
    .single();

  if (fetchErr) {
    throw new Error(fetchErr.message);
  }

  // Clear existing primary image
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', img.product_id);

  // Set new primary image
  const { data, error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Also update products.main_image_url
  await supabase
    .from('products')
    .update({
      main_image_url: img.public_url,
      main_image_path: img.storage_path,
    })
    .eq('id', img.product_id);

  // Audit log
  await supabase.from('audit_logs').insert({
    action: 'update',
    entity_type: 'product_image',
    entity_id: img.product_id,
    changes: {
      primary_image_id: imageId,
    },
  });

  return data;
}
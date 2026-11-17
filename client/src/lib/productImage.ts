/**
 * TRINAYAA DETERMINISTIC PRODUCT IMAGE RESOLUTION
 * 
 * Hierarchy:
 * 1. Verified product-specific botanical image (/images/products/generated/{sku}.webp)
 * 2. Category-specific temporary placeholder (/images/products/placeholders/placeholder_{cat}.webp)
 * 3. Generic botanical archive placeholder (/images/products/placeholders/placeholder_botanical_generic.webp)
 */

export const VERIFIED_BOTANICAL_SKUS = new Set([
  // Batch 1 (Approved)
  "TRN-1001", "TRN-1002", "TRN-1003", "TRN-1004", "TRN-1005",
  "TRN-1006", "TRN-1007", "TRN-1008", "TRN-1009", "TRN-1010",
  // Batch 2 (Verified botanical photography)
  "TRN-1011", "TRN-1012", "TRN-1013", "TRN-1014", "TRN-1015",
  "TRN-1016", "TRN-1017", "TRN-1018", "TRN-1019", "TRN-1020",
  "TRN-1021", "TRN-1022", "TRN-1023", "TRN-1024", "TRN-1025",
  "TRN-1026", "TRN-1027", "TRN-1028", "TRN-1029", "TRN-1030",
  // Batch 3 (Verified botanical photography)
  "TRN-1031", "TRN-1032", "TRN-1033", "TRN-1034", "TRN-1035",
  "TRN-1036", "TRN-1037", "TRN-1038", "TRN-1039", "TRN-1040",
  "TRN-1041", "TRN-1042", "TRN-1043", "TRN-1044", "TRN-1045",
  "TRN-1046", "TRN-1047", "TRN-1048", "TRN-1049", "TRN-1050",
  // Batch 4 (Verified botanical photography)
  "TRN-1051", "TRN-1052", "TRN-1053", "TRN-1054", "TRN-1055",
  "TRN-1056", "TRN-1057", "TRN-1058", "TRN-1059", "TRN-1060",
  "TRN-1061", "TRN-1062", "TRN-1063", "TRN-1064", "TRN-1065",
  "TRN-1066", "TRN-1067", "TRN-1068", "TRN-1069", "TRN-1070",
  // Batch 5 (Verified botanical photography)
  "TRN-1071", "TRN-1072", "TRN-1073", "TRN-1074", "TRN-1075",
  "TRN-1076", "TRN-1077", "TRN-1078", "TRN-1079", "TRN-1080",
  // Batch 6 (Verified botanical photography)
  "TRN-1081", "TRN-1082", "TRN-1083", "TRN-1084", "TRN-1085",
  "TRN-1086", "TRN-1087", "TRN-1088", "TRN-1089", "TRN-1090",
  // Batch 7 (Verified botanical photography)
  "TRN-1091", "TRN-1092", "TRN-1093", "TRN-1094", "TRN-1095",
  "TRN-1096", "TRN-1097", "TRN-1098", "TRN-1099", "TRN-1100",
  // Batch 8 (Verified botanical photography)
  "TRN-1101", "TRN-1102", "TRN-1103", "TRN-1104", "TRN-1105",
  "TRN-1106", "TRN-1107", "TRN-1108", "TRN-1109", "TRN-1110",
  // Batch 9 (Verified botanical photography)
  "TRN-1111", "TRN-1112", "TRN-1113", "TRN-1114", "TRN-1115",
  "TRN-1116", "TRN-1117", "TRN-1118", "TRN-1119", "TRN-1120",
  // Batch 10 (Verified botanical photography)
  "TRN-1121", "TRN-1122", "TRN-1123", "TRN-1124", "TRN-1125",
  "TRN-1126", "TRN-1127", "TRN-1128", "TRN-1129", "TRN-1130",
  // Batch 11 (Verified botanical photography)
  "TRN-1131", "TRN-1132", "TRN-1133", "TRN-1134", "TRN-1135",
  "TRN-1136", "TRN-1137", "TRN-1138", "TRN-1139", "TRN-1140",
  // Batch 12 (Verified botanical photography)
  "TRN-1141", "TRN-1142", "TRN-1143", "TRN-1144", "TRN-1145",
  "TRN-1146", "TRN-1147", "TRN-1148", "TRN-1149", "TRN-1150",
  // Batch 13 (Verified botanical photography)
  "TRN-1151", "TRN-1152", "TRN-1153", "TRN-1154", "TRN-1155",
  "TRN-1156", "TRN-1157", "TRN-1158", "TRN-1159", "TRN-1160",
  // Final Batch (Verified botanical photography - 162/162 Complete!)
  "TRN-1161", "TRN-1162"
]);

export function getCategoryPlaceholder(category?: string | null, productType?: string | null): string {
  const normCat = (category || "").toLowerCase().trim();
  const normType = (productType || "").toLowerCase().trim();

  if (normType.includes("seed") || normCat.includes("seed")) {
    return "/images/products/placeholders/placeholder_seeds.webp";
  }
  if (normType.includes("powder") || normCat.includes("powder")) {
    return "/images/products/placeholders/placeholder_raw_powders.webp";
  }
  if (normCat.includes("hair")) {
    return "/images/products/placeholders/placeholder_hair_care.webp";
  }
  if (normCat.includes("skin")) {
    return "/images/products/placeholders/placeholder_skin_care.webp";
  }
  if (normCat.includes("drink") || normCat.includes("tea") || normCat.includes("welness")) {
    return "/images/products/placeholders/placeholder_wellness_drinks.webp";
  }
  if (normCat.includes("spice") || normCat.includes("culinary")) {
    return "/images/products/placeholders/placeholder_spices_culinary.webp";
  }
  if (normCat.includes("aroma") || normCat.includes("incense") || normCat.includes("resin")) {
    return "/images/products/placeholders/placeholder_aromatherapy_incense.webp";
  }
  if (normCat.includes("health")) {
    return "/images/products/placeholders/placeholder_health_care.webp";
  }
  if (normType.includes("herb") || normCat.includes("herb")) {
    return "/images/products/placeholders/placeholder_herbs.webp";
  }

  return "/images/products/placeholders/placeholder_botanical_generic.webp";
}

export function resolveProductImage(
  sku?: string | null,
  category?: string | null,
  productType?: string | null,
  currentImage?: string | null
): string {
  const cleanSku = (sku || "").toUpperCase().trim();

  // 1. Verified product-specific botanical image
  if (cleanSku && VERIFIED_BOTANICAL_SKUS.has(cleanSku)) {
    return `/images/products/generated/${cleanSku}.webp`;
  }

  // 2. Check if currentImage is a valid generated botanical image
  if (currentImage && currentImage.includes("/images/products/generated/")) {
    return currentImage;
  }

  // 3. Category placeholder fallback
  return getCategoryPlaceholder(category, productType);
}


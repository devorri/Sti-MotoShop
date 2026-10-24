-- =====================================================================
-- Boss Rap MotoShop - Products Database Seed & Update Script
-- Updated with realistic part weights (weight_kg) and bulky parcel flags (is_bulky)
-- Idempotent: Can be safely executed multiple times without constraint errors
-- =====================================================================

-- Step 1: Ensure columns exist in public.products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS weight_kg numeric DEFAULT 0.50,
  ADD COLUMN IF NOT EXISTS is_bulky boolean DEFAULT false;

-- Step 2: Upsert all 47 products with accurate weights and bulky classifications
INSERT INTO public.products (
  id,
  name,
  description,
  category,
  price,
  stock,
  low_stock_level,
  barcode,
  image_url,
  created_at,
  weight_kg,
  is_bulky
) VALUES
  ('PROD-896575', 'GR5 Titanium bolts Flat allen wrench 10mm', 'High performance motorcycle part/accessory.', 'bolts', '55.00', 4569, 5, '502681896575', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792681826254_sq9s7p8.webp', '2026-10-22T15:11:37.341225+00:00', '0.03', false),
  ('PROD-725853', 'GR5 Titanium Bolts Flat head 5mm', 'High performance motorcycle part/accessory.', 'bolts', '65.00', 4999, 5, '502681725853', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792681672319_54pbbll.jpg', '2026-10-22T15:08:46.510248+00:00', '0.02', false),
  ('PROD-296596', 'GR5 Bolts Big head 5mm', 'High performance motorcycle part/accessory.', 'Bolts', '135.00', 3500, 5, '502681296596', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792681245588_e9mn7jx.jpg', '2026-10-22T15:01:37.397258+00:00', '0.02', false),
  ('PROD-812431', 'GRACING Collant', 'High performance motorcycle part/accessory.', 'Colling Engine', '350.00', 35, 5, '502680812431', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680773253_2rk8x1l.jpg', '2026-10-22T14:53:32.873665+00:00', '0.65', false),
  ('PROD-756766', 'RS8 Coolant', 'High performance motorcycle part/accessory.', 'Cooling Engine', '450.00', 45, 5, '502680756766', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680678749_y0twb1a.jpg', '2026-10-22T14:52:37.610965+00:00', '1.05', false),
  ('PROD-606018', 'Gracing Clutch Bell Nmax, Aerox', 'High performance motorcycle part/accessory.', 'CVT', '2300.00', 13, 5, '501358606018', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791358510195_eqigvb2.jpg', '2026-10-07T07:36:49.687449+00:00', '0.95', false),
  ('PROD-728064', 'Gracing Clutch Lining NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '2100.00', 20, 5, '501355728064', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355693591_qzlde28.jpg', '2026-10-07T06:48:50.742231+00:00', '1.10', false),
  ('PROD-794591', 'Gracing Clutch Shoe w/ 1200 rpm NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '1400.00', 15, 5, '501355794591', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355736406_cmxm8p9.jpg', '2026-10-07T06:49:57.871441+00:00', '0.90', false),
  ('PROD-670682', 'Gracing CVT set PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '4350.00', 13, 5, '501355670682', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355615916_mabdjgo.jpg', '2026-10-07T06:47:53.350738+00:00', '4.80', true),
  ('PROD-605362', 'Gracing Pulley Bushing NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '500.00', 100, 5, '501355605362', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355568760_tg3siqy.jpg', '2026-10-07T06:46:48.0262+00:00', '0.15', false),
  ('PROD-834639', 'Gracing Pulley Set NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '2300.00', 12, 5, '501355834639', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355805466_5qu6bnz.jpg', '2026-10-07T06:50:37.317454+00:00', '1.40', false),
  ('PROD-921999', 'Gracing Steel Torque Drive NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '3300.00', 9, 5, '501355921999', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355881903_lu8i2id.jpg', '2026-10-07T06:52:04.918466+00:00', '1.90', false),
  ('PROD-751420', 'HIRC Center Spring 1500 rpm 1800 rpm NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '550.00', 22, 5, '502678751420', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678697551_9b04f9x.jpg', '2026-10-22T14:19:12.138655+00:00', '0.28', false),
  ('PROD-077082', 'HIRC Clutch Rubber dumper NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '150.00', 150, 5, '502679077082', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679027265_mzu6nh2.jpg', '2026-10-22T14:24:37.908539+00:00', '0.04', false),
  ('PROD-258528', 'HIRC Clutch shoe NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '700.00', 40, 5, '502679258528', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679194132_7j7c1vc.jpg', '2026-10-22T14:27:39.083481+00:00', '0.85', false),
  ('PROD-822940', 'HIRC Flyball 8g 9g 10g 11g 12g Nmax,Aerox', 'High performance motorcycle part/accessory.', 'CVT', '600.00', 50, 5, '502678822940', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678769129_5tlgppx.jpg', '2026-10-22T14:20:23.716078+00:00', '0.09', false),
  ('PROD-450514', 'HIRC Pulley SetNMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '1400.00', 25, 5, '502679450514', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679420154_fbk2ykl.jpg', '2026-10-22T14:30:51.137472+00:00', '1.40', false),
  ('PROD-920184', 'HIRC Slider piece Nmax,Aerox,Click', 'High performance motorcycle part/accessory.', 'CVT', '160.00', 100, 5, '502678920184', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678839343_lgfnvvr.jpg', '2026-10-22T14:22:00.925559+00:00', '0.03', false),
  ('PROD-316078', 'HIRC Steel TD NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '3200.00', 30, 5, '502679316078', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679275195_qy6jpd7.jpg', '2026-10-22T14:28:36.7424+00:00', '1.90', false),
  ('PROD-679727', 'Keso Center Spring 1000rpm,1200rpm,1500rpm,2000rpmNMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '450.00', 99, 5, '501354679727', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354658379_ve8i4b8.jpg', '2026-10-07T06:31:22.351814+00:00', '0.28', false),
  ('PROD-729787', 'Keso Clutch Spring Keso Center Spring 1000rpm,1200rpm,1500rpm,2000rpmNMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '380.00', 7, 5, '501354729787', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354689785_7lpt7zk.jpg', '2026-10-07T06:32:12.424006+00:00', '0.08', false),
  ('PROD-785365', 'Keso CVT Clean', 'High performance motorcycle part/accessory.', 'CVT', '150.00', 15, 5, '501354785365', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354740583_19x525v.jpg', '2026-10-07T06:33:08.171542+00:00', '0.45', false),
  ('PROD-846451', 'Keso Slider Peace NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '150.00', 13, 5, '501354846451', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354798739_qr7ihrl.jpg', '2026-10-07T06:34:09.160408+00:00', '0.03', false),
  ('PROD-478729', 'Pulley Set NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '2500.00', 25, 5, '501354478729', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354418790_lu7dnng.jpg', '2026-10-07T06:28:01.589412+00:00', '1.40', false),
  ('PROD-188833', 'Wf Clutch Assembly NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '1850.00', 10, 5, '501355188833', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355133903_z0azqux.jpg', '2026-10-07T06:39:51.694621+00:00', '1.85', false),
  ('PROD-289029', 'WF Clutch bell NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '1450.00', 19, 5, '501354289029', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791354190946_day133i.jpg', '2026-10-07T06:24:51.908405+00:00', '0.95', false),
  ('PROD-275949', 'Wf Forge alluminum Torque Drive assembly NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '6800.00', 12, 5, '501355275949', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355210953_7u40ihp.jpg', '2026-10-07T06:41:18.857696+00:00', '1.50', false),
  ('PROD-396522', 'Wf Pulley Set NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'CVT', '2300.00', 12, 5, '501355396522', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355359073_vbrpk7a.jpg', '2026-10-07T06:43:19.397562+00:00', '1.45', false),
  ('PROD-343861', 'Wf Steel Torque Drive Aerox,Nmax', 'High performance motorcycle part/accessory.', 'CVT', '3250.00', 11, 5, '501355343861', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355296799_32o97f8.jpg', '2026-10-07T06:42:26.525514+00:00', '1.95', false),
  ('PROD-256393', 'CRP Ignition Coil Nmax,Aerox,Sniper 155', 'High performance motorcycle part/accessory.', 'Electrical', '2460.00', 40, 5, '502678256393', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678177657_fxumtxc.jpg', '2026-10-22T14:10:56.995687+00:00', '0.25', false),
  ('PROD-990685', 'HIRC Fuel Pump IC Nmax,Aerox', 'High performance motorcycle part/accessory.', 'Electrical', '430.00', 60, 5, '502678990685', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678939703_2felnq0.jpg', '2026-10-22T14:23:11.334154+00:00', '0.12', false),
  ('PROD-646648', 'RS8 Ignition Coil More Torque Nmax,Aerox', 'High performance motorcycle part/accessory.', 'Electrical', '4500.00', 30, 5, '502680646648', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680596840_8ghl2iw.jpg', '2026-10-22T14:50:47.070052+00:00', '0.28', false),
  ('PROD-472064', 'Gracing Block Crome Bore 63mm,66mm NMAX,AEROX', 'High performance motorcycle part/accessory.', 'Engine & Drivetrain', '8500.00', 13, 5, '501355472064', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355409864_yijfg4k.jpg', '2026-10-07T06:44:34.740962+00:00', '2.60', true),
  ('PROD-974085', 'Gracing Camshaft S1,S2,S3 NMAX,AEROX,PCX,CLICK', 'High performance motorcycle part/accessory.', 'Engine & Drivetrain', '1850.00', 12, 5, '501355974085', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355929976_2duk7eb.jpg', '2026-10-07T06:52:56.785364+00:00', '0.45', false),
  ('PROD-558222', 'Gracing Cylinder Head 20/23,21/24,23/26NMAX,AEROX', 'High performance motorcycle part/accessory.', 'Engine & Drivetrain', '14500.00', 15, 5, '501355558222', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355483372_bruz6t4.jpg', '2026-10-07T06:46:01.107227+00:00', '3.40', true),
  ('PROD-757222', 'RS8 Eco Scooter oil 10W-35 1L', 'High performance motorcycle part/accessory.', 'ENGINE OIL', '450.00', 50, 5, '502679757222', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679695481_a75nuvz.jpg', '2026-10-22T14:35:57.732867+00:00', '0.98', false),
  ('PROD-665013', 'RS8 Engine oil 1L', 'High performance motorcycle part/accessory.', 'ENGINE OIL', '450.00', 45, 5, '502679665013', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679560212_ogtl6oa.jpg', '2026-10-22T14:34:25.499335+00:00', '0.98', false),
  ('PROD-557013', 'HIRC Exhaust pipe NMAX,AEROX,PCX,CLICK,MIO', 'High performance motorcycle part/accessory.', 'Exhaust pipe', '6500.00', 25, 5, '502678557013', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792678414368_e2u03kz.jpg', '2026-10-22T14:15:57.919707+00:00', '4.60', true),
  ('PROD-204400', 'JVT TearDrop v4 35mm Aerox,Nmax', 'High performance motorcycle part/accessory.', 'Exhaust pipe', '8500.00', 20, 5, '502680204400', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680158559_js9hiz1.jpg', '2026-10-22T14:43:25.011767+00:00', '4.80', true),
  ('PROD-141777', 'JVT V3 Nmax,Aerox', 'High performance motorcycle part/accessory.', 'Exhaust pipe', '7500.00', 32, 5, '502680141777', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680086350_pmq8qgl.jpg', '2026-10-22T14:42:22.373397+00:00', '5.20', true),
  ('PROD-313601', 'JVT V4 Sharktip Black Straight 38mm', 'High performance motorcycle part/accessory.', 'Exhaust pipe', '8500.00', 20, 5, '502680313601', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680231867_h7vnsqa.jpg', '2026-10-22T14:45:14.024951+00:00', '5.00', true),
  ('PROD-061971', 'JVT V4 Titanium 35/38mm', 'High performance motorcycle part/accessory.', 'EXHAUST PIPE', '19500.00', 30, 5, '502680061971', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679911358_m2k7qse.jpg', '2026-10-22T14:41:02.942532+00:00', '4.50', true),
  ('PROD-875029', 'Gracing Gear Oil', 'High performance motorcycle part/accessory.', 'Lubricant', '120.00', 26, 5, '501355875029', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1791355844407_wn89c94.jpg', '2026-10-07T06:51:17.698393+00:00', '0.15', false),
  ('PROD-873909', 'JVT Gear oil Scooter', 'High performance motorcycle part/accessory.', 'Lubricant', '135.00', 400, 5, '502679873909', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679847953_jlnrhtj.jpg', '2026-10-22T14:37:54.431224+00:00', '0.15', false),
  ('PROD-815050', 'RS8 Gear oil Scooter', 'High performance motorcycle part/accessory.', 'Lubricant', '120.00', 500, 5, '502679815050', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792679780724_7u2qazf.jpg', '2026-10-22T14:36:55.474135+00:00', '0.15', false),
  ('PROD-506830', 'JVT New Version Front Shock Suspension Nmax v123 Aerox v123', 'High performance motorcycle part/accessory.', 'Suspension', '15500.00', 30, 5, '502680506830', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680438147_d0ywy02.jpg', '2026-10-22T14:48:27.261652+00:00', '4.50', true),
  ('PROD-410969', 'JVT Rear Suspension 305mm Nmax,Aerox', 'High performance motorcycle part/accessory.', 'Suspension', '15600.00', 45, 5, '502680410969', 'https://bqqridjerujseolhfcie.supabase.co/storage/v1/object/public/Files/products/1792680360773_35kejg8.jpg', '2026-10-22T14:46:51.586204+00:00', '3.80', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  low_stock_level = EXCLUDED.low_stock_level,
  barcode = EXCLUDED.barcode,
  image_url = EXCLUDED.image_url,
  weight_kg = EXCLUDED.weight_kg,
  is_bulky = EXCLUDED.is_bulky;

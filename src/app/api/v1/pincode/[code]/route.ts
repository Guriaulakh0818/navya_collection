import { NextRequest, NextResponse } from 'next/server';

interface PincodeLocality {
  name: string;
  district: string;
  state: string;
}

interface PincodeResponseData {
  pincode: string;
  state: string;
  district: string;
  city: string;
  localities: PincodeLocality[];
}

// In-memory cache for fast repeated lookups
const pincodeCache = new Map<string, PincodeResponseData>();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const pincode = String(code || '').trim();

  // Validate 6-digit Indian PIN code format (starts with 1-9 followed by 5 digits)
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Please enter a valid Indian PIN code.',
      },
      { status: 400 },
    );
  }

  // Check cache first
  if (pincodeCache.has(pincode)) {
    return NextResponse.json({
      success: true,
      data: pincodeCache.get(pincode),
    });
  }

  try {
    // 1. Try Primary Source: postalpincode.in API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let primaryRes: Response | null = null;
    try {
      primaryRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Ignore primary timeout / fetch error and fallback to secondary
    } finally {
      clearTimeout(timeoutId);
    }

    if (primaryRes && primaryRes.ok) {
      const json = await primaryRes.json();
      if (Array.isArray(json) && json.length > 0) {
        const item = json[0];
        if (
          item.Status === 'Success' &&
          Array.isArray(item.PostOffice) &&
          item.PostOffice.length > 0
        ) {
          const postOffices = item.PostOffice;
          const firstPO = postOffices[0];
          const state = firstPO.State || firstPO.Circle || '';
          const district = firstPO.District || firstPO.Division || firstPO.Region || '';
          const city = firstPO.Block && firstPO.Block !== 'NA' ? firstPO.Block : district;

          const localities: PincodeLocality[] = postOffices.map((po: any) => ({
            name: po.Name || po.Block || district,
            district: po.District || district,
            state: po.State || state,
          }));

          const responseData: PincodeResponseData = {
            pincode,
            state,
            district,
            city: city || district,
            localities,
          };

          pincodeCache.set(pincode, responseData);

          return NextResponse.json({
            success: true,
            data: responseData,
          });
        }

        if (
          item.Status === 'Error' ||
          (Array.isArray(item.PostOffice) && item.PostOffice.length === 0)
        ) {
          return NextResponse.json(
            {
              success: false,
              message: 'Please enter a valid Indian PIN code.',
            },
            { status: 404 },
          );
        }
      }
    }

    // 2. Try Secondary Fallback Source: zippopotam.us API
    const zippoRes = await fetch(`https://api.zippopotam.us/in/${pincode}`, {
      headers: { Accept: 'application/json' },
    });

    if (zippoRes.ok) {
      const zippoData = await zippoRes.json();
      if (zippoData.places && Array.isArray(zippoData.places) && zippoData.places.length > 0) {
        const firstPlace = zippoData.places[0];
        const state = firstPlace.state || '';
        const placeName = firstPlace['place name'] || '';

        const localities: PincodeLocality[] = zippoData.places.map((p: any) => ({
          name: p['place name'] || placeName,
          district: placeName,
          state: p.state || state,
        }));

        const responseData: PincodeResponseData = {
          pincode,
          state,
          district: placeName,
          city: placeName,
          localities,
        };

        pincodeCache.set(pincode, responseData);

        return NextResponse.json({
          success: true,
          data: responseData,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Please enter a valid Indian PIN code.',
      },
      { status: 404 },
    );
  } catch (err: any) {
    console.error('PIN code lookup error:', err);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to fetch location. Please try again or enter your location manually.',
      },
      { status: 500 },
    );
  }
}

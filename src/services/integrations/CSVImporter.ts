import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import type { ParsedLeadInput, ImportResult, CSVImportOptions } from './types';

export class CSVImporter {
  async import(file: File, options?: CSVImportOptions): Promise<ImportResult> {
    const batchSize = options?.batchSize || 200;
    const detectFormat = options?.detectFormat !== false;
    const skipDuplicates = options?.skipDuplicates !== false;

    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const rawData = results.data as any[];

            const format = detectFormat ? this.detectFormat(rawData[0]) : 'generic';
            console.log(`Detected format: ${format}`);

            const mappedData = rawData.map(row => this.mapRow(row, format));

            const validData = mappedData.filter(row => this.validateRow(row));

            const importResult = await this.insertData(validData, batchSize, skipDuplicates);

            resolve({
              success: true,
              total: rawData.length,
              imported: importResult.imported,
              failed: importResult.failed,
              duplicates: importResult.duplicates,
              errors: importResult.errors,
            });
          } catch (error) {
            console.error('Import processing error:', error);
            resolve({
              success: false,
              total: 0,
              imported: 0,
              failed: 0,
              duplicates: 0,
              errors: [{
                row: 0,
                data: {},
                error: error instanceof Error ? error.message : 'Unknown error',
                reason: 'database_error',
              }],
            });
          }
        },
        error: (error) => {
          console.error('Parse error:', error);
          resolve({
            success: false,
            total: 0,
            imported: 0,
            failed: 0,
            duplicates: 0,
            errors: [{
              row: 0,
              data: {},
              error: error.message || 'Parse error',
              reason: 'validation',
            }],
          });
        },
      });
    });
  }

  private detectFormat(firstRow: any): 'ninja_data' | 'google_my_business' | 'generic' {
    const keys = Object.keys(firstRow).map(k => k.toLowerCase());

    const hasNinjaFields = keys.some(k => k.includes('ninja') || k.includes('abn') || k.includes('acn'));
    if (hasNinjaFields) return 'ninja_data';

    const hasGoogleFields = keys.some(k =>
      k === 'name' ||
      k.includes('phone_standard_format') ||
      k.includes('street_address') ||
      k.includes('first_category')
    );
    if (hasGoogleFields) return 'google_my_business';

    return 'generic';
  }

  private mapRow(row: any, format: string): ParsedLeadInput {
    switch (format) {
      case 'ninja_data':
        return this.mapNinjaDataRow(row);
      case 'google_my_business':
        return this.mapGoogleMyBusinessRow(row);
      default:
        return this.mapGenericRow(row);
    }
  }

  private mapNinjaDataRow(row: any): ParsedLeadInput {
    return {
      business_name: row['Business Name'] || row['business_name'] || row['Company Name'],
      phone: row['Phone'] || row['phone'] || row['Phone Number'],
      mobile: row['Mobile'] || row['mobile'] || row['Cell Phone'],
      email: row['Email'] || row['email'] || row['Email Address'],
      website: row['Website'] || row['website'] || row['Web'],
      address_line1: row['Address'] || row['address'] || row['Street Address'],
      address_line2: row['Address 2'] || row['address_2'],
      suburb: row['Suburb'] || row['suburb'] || row['City'],
      city: row['City'] || row['city'],
      state: row['State'] || row['state'] || row['Province'],
      postcode: row['Postcode'] || row['postcode'] || row['Zip'] || row['ZIP Code'],
      country: row['Country'] || row['country'] || 'Australia',
      vertical: row['Industry'] || row['industry'] || row['Vertical'] || row['Category'],
      business_type: row['Business Type'] || row['business_type'],
      employee_count: this.parseNumber(row['Employees'] || row['employees'] || row['Employee Count']),
      estimated_revenue: this.parseNumber(row['Revenue'] || row['revenue'] || row['Annual Revenue']),
    };
  }

  private mapGoogleMyBusinessRow(row: any): ParsedLeadInput {
    return {
      business_name: row['Name'] || row['business_name'],
      phone: row['Phone_Standard_format'] || row['Phone_1'] || row['phone'],
      mobile: row['Phone From WEBSITE'] || row['mobile'],
      email: row['Email From WEBSITE'] || row['email'],
      website: row['Website'] || row['website'],
      facebook_url: row['Facebook URL'] || row['facebook_url'],
      instagram_url: row['Instagram URL'] || row['instagram_url'],
      linkedin_url: row['Linkedin URL'] || row['linkedin_url'],
      twitter_url: row['Twitter URL'] || row['twitter_url'],
      address_line1: row['Street_Address'] || row['address_line1'],
      city: row['City'] || row['city'],
      suburb: row['Municipality'] || row['City'] || row['suburb'],
      state: row['State'] || row['state'],
      postcode: row['Zip'] || row['postcode'],
      country: row['Country'] || row['country'] || 'Australia',
      latitude: this.parseNumber(row['Latitude']),
      longitude: this.parseNumber(row['Longitude']),
      timezone: row['Timezone'] || row['timezone'],
      vertical: row['First_category'] || row['vertical'],
      business_type: row['Second_category'] || row['business_type'],
    };
  }

  private mapGenericRow(row: any): ParsedLeadInput {
    const normalized: ParsedLeadInput = {};

    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (lowerKey.includes('business') || lowerKey.includes('company') || lowerKey.includes('name')) {
        normalized.business_name = row[key];
      } else if (lowerKey.includes('phone') || lowerKey.includes('telephone')) {
        normalized.phone = row[key];
      } else if (lowerKey.includes('mobile') || lowerKey.includes('cell')) {
        normalized.mobile = row[key];
      } else if (lowerKey.includes('email') || lowerKey.includes('mail')) {
        normalized.email = row[key];
      } else if (lowerKey.includes('website') || lowerKey.includes('web') || lowerKey.includes('url')) {
        normalized.website = row[key];
      } else if (lowerKey.includes('address') || lowerKey.includes('street')) {
        normalized.address_line1 = row[key];
      } else if (lowerKey.includes('suburb')) {
        normalized.suburb = row[key];
      } else if (lowerKey.includes('city')) {
        normalized.city = row[key];
      } else if (lowerKey.includes('state') || lowerKey.includes('province')) {
        normalized.state = row[key];
      } else if (lowerKey.includes('postcode') || lowerKey.includes('zip')) {
        normalized.postcode = row[key];
      } else if (lowerKey.includes('country')) {
        normalized.country = row[key];
      } else if (lowerKey.includes('industry') || lowerKey.includes('vertical') || lowerKey.includes('category')) {
        normalized.vertical = row[key];
      }
    });

    if (!normalized.country) {
      normalized.country = 'Australia';
    }

    return normalized;
  }

  private validateRow(row: ParsedLeadInput): boolean {
    return !!(row.business_name || row.email || row.phone);
  }

  private parseNumber(value: any): number | undefined {
    if (!value) return undefined;
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
    return isNaN(num) ? undefined : num;
  }

  private async insertData(data: ParsedLeadInput[], batchSize: number, skipDuplicates: boolean) {
    let imported = 0;
    let failed = 0;
    let duplicates = 0;
    const errors: ImportResult['errors'] = [];

    const batches: ParsedLeadInput[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      try {
        const rowsToInsert = batch.map(row => ({
          business_name: row.business_name,
          phone: row.phone,
          mobile: row.mobile,
          email: row.email,
          website: row.website,
          facebook_url: row.facebook_url,
          instagram_url: row.instagram_url,
          linkedin_url: row.linkedin_url,
          twitter_url: row.twitter_url,
          address_line1: row.address_line1,
          address_line2: row.address_line2,
          city: row.city,
          suburb: row.suburb,
          postcode: row.postcode,
          state: row.state,
          country: row.country || 'Australia',
          latitude: row.latitude,
          longitude: row.longitude,
          timezone: row.timezone,
          vertical: row.vertical,
          business_type: row.business_type,
          employee_count: row.employee_count,
          estimated_revenue: row.estimated_revenue,
          status: 'new',
          quality_score: 50,
          data_source: 'csv_import',
        }));

        const { data: insertedData, error } = await supabase
          .from('prospects')
          .insert(rowsToInsert)
          .select('id');

        if (error) {
          if (error.code === '23505' && skipDuplicates) {
            duplicates += rowsToInsert.length;
            batch.forEach((row, idx) => {
              errors.push({
                row: batchIndex * batchSize + idx + 1,
                data: row,
                error: 'Duplicate record',
                reason: 'duplicate',
              });
            });
          } else {
            failed += rowsToInsert.length;
            batch.forEach((row, idx) => {
              errors.push({
                row: batchIndex * batchSize + idx + 1,
                data: row,
                error: error.message || 'Database error',
                reason: 'database_error',
              });
            });
          }
        } else {
          imported += insertedData?.length || rowsToInsert.length;
        }
      } catch (error: any) {
        failed += batch.length;
        batch.forEach((row, idx) => {
          errors.push({
            row: batchIndex * batchSize + idx + 1,
            data: row,
            error: error?.message || 'Unknown error',
            reason: 'database_error',
          });
        });
      }
    }

    return { imported, failed, duplicates, errors };
  }
}

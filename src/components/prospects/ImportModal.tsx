import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedRow {
  business_name?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  vertical?: string;
  [key: string]: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: ParsedRow;
}

interface FailedRecord {
  row: number;
  business_name?: string;
  email?: string;
  phone?: string;
  error: string;
  reason: 'duplicate' | 'validation' | 'database_error';
}

export const ImportModal = ({ isOpen, onClose, onSuccess }: ImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0, duplicates: 0 });
  const [failedRecords, setFailedRecords] = useState<FailedRecord[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as ParsedRow[];
        setPreview(data.slice(0, 10));

        const validated = data.map(row => validateRow(row));
        setValidationResults(validated);

        setParsing(false);
        setStep('preview');
      },
      error: (error) => {
        console.error('Parse error:', error);
        setParsing(false);
      }
    });
  };

  const mapGoogleMyBusinessRow = (row: any): ParsedRow => {
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
      latitude: row['Latitude'] ? parseFloat(row['Latitude']) : null,
      longitude: row['Longitude'] ? parseFloat(row['Longitude']) : null,
      timezone: row['Timezone'] || row['timezone'],
      vertical: row['First_category'] || row['vertical'],
      business_type: row['Second_category'] || row['business_type'],
      ...row
    };
  };

  const validateRow = (row: ParsedRow): ValidationResult => {
    const errors: string[] = [];
    const mappedRow = mapGoogleMyBusinessRow(row);

    if (!mappedRow.business_name && !mappedRow.email && !mappedRow.phone) {
      errors.push('Missing business name, email, and phone');
    }

    if (mappedRow.email && !mappedRow.email.includes('@')) {
      errors.push('Invalid email format');
    }

    if (mappedRow.phone && mappedRow.phone.length < 8) {
      errors.push('Invalid phone number');
    }

    return {
      valid: errors.length === 0,
      errors,
      data: mappedRow
    };
  };

  const checkDuplicate = async (row: ParsedRow): Promise<boolean> => {
    if (!row.business_name && !row.email && !row.phone) return false;

    const { data } = await supabase
      .from('prospects')
      .select('id')
      .or(`business_name.eq.${row.business_name},email.eq.${row.email},phone.eq.${row.phone}`)
      .limit(1)
      .maybeSingle();

    return !!data;
  };

  const handleImport = async () => {
    setImporting(true);
    setStep('importing');

    const validRows = validationResults.filter(r => r.valid);
    const invalidRows = validationResults.filter(r => !r.valid);
    let success = 0;
    let failed = 0;
    let duplicates = 0;
    const failures: FailedRecord[] = [];

    invalidRows.forEach((result, index) => {
      failures.push({
        row: index + 1,
        business_name: result.data.business_name,
        email: result.data.email,
        phone: result.data.phone,
        error: result.errors.join(', '),
        reason: 'validation'
      });
    });

    setStats({
      total: validRows.length,
      success: 0,
      failed: 0,
      duplicates: 0
    });

    const BATCH_SIZE = 200;
    const batches = [];

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      batches.push({ startIndex: i, rows: validRows.slice(i, i + BATCH_SIZE) });
    }

    for (const batch of batches) {
      try {
        const rowsToInsert = batch.rows.map((result) => ({
          business_name: result.data.business_name,
          phone: result.data.phone,
          mobile: result.data.mobile,
          email: result.data.email,
          website: result.data.website,
          facebook_url: result.data.facebook_url,
          instagram_url: result.data.instagram_url,
          linkedin_url: result.data.linkedin_url,
          twitter_url: result.data.twitter_url,
          address_line1: result.data.address_line1,
          city: result.data.city,
          suburb: result.data.suburb,
          postcode: result.data.postcode,
          state: result.data.state,
          country: result.data.country || 'Australia',
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          timezone: result.data.timezone,
          vertical: result.data.vertical,
          business_type: result.data.business_type,
          status: 'new',
          quality_score: 50,
          data_source: 'google_my_business',
          original_data: result.data,
        }));

        const { data, error } = await supabase
          .from('prospects')
          .insert(rowsToInsert)
          .select('id');

        if (error) {
          console.error('Batch insert error:', error);
          if (error.code === '23505') {
            duplicates += rowsToInsert.length;
            batch.rows.forEach((result, idx) => {
              failures.push({
                row: batch.startIndex + idx + 1,
                business_name: result.data.business_name,
                email: result.data.email,
                phone: result.data.phone,
                error: 'Duplicate record already exists in database',
                reason: 'duplicate'
              });
            });
          } else {
            failed += rowsToInsert.length;
            batch.rows.forEach((result, idx) => {
              failures.push({
                row: batch.startIndex + idx + 1,
                business_name: result.data.business_name,
                email: result.data.email,
                phone: result.data.phone,
                error: error.message || 'Database error',
                reason: 'database_error'
              });
            });
          }
        } else {
          success += data?.length || rowsToInsert.length;
        }

        setStats({
          total: validRows.length,
          success,
          failed,
          duplicates
        });
      } catch (error: any) {
        console.error('Batch processing error:', error);
        failed += batch.rows.length;
        batch.rows.forEach((result, idx) => {
          failures.push({
            row: batch.startIndex + idx + 1,
            business_name: result.data.business_name,
            email: result.data.email,
            phone: result.data.phone,
            error: error?.message || 'Unknown error',
            reason: 'database_error'
          });
        });
        setStats({
          total: validRows.length,
          success,
          failed,
          duplicates
        });
      }
    }

    setFailedRecords(failures);
    setImporting(false);
    setStep('complete');
  };

  const downloadFailedRecords = () => {
    const csv = Papa.unparse({
      fields: ['Row', 'Business Name', 'Email', 'Phone', 'Error', 'Reason'],
      data: failedRecords.map(f => [
        f.row,
        f.business_name || '',
        f.email || '',
        f.phone || '',
        f.error,
        f.reason
      ])
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-imports-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setValidationResults([]);
    setFailedRecords([]);
    setStep('upload');
    setStats({ total: 0, success: 0, failed: 0, duplicates: 0 });
    onClose();
    if (step === 'complete') {
      onSuccess();
    }
  };

  const validCount = validationResults.filter(r => r.valid).length;
  const invalidCount = validationResults.length - validCount;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Prospects" size="xl">
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="text-center">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">CSV or Excel files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {parsing && (
            <div className="text-center py-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
              <p className="text-gray-600">Parsing file...</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Required: business_name, email, or phone (at least one)</li>
              <li>• Optional: address_line1, suburb, postcode, state, vertical</li>
              <li>• First row must contain column headers</li>
              <li>• Duplicates will be automatically detected and skipped</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Valid Rows</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{validCount}</p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Invalid Rows</span>
              </div>
              <p className="text-2xl font-bold text-red-900">{invalidCount}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Total Rows</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{validationResults.length}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-3">Preview (First 10 rows)</h4>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.map((row, idx) => {
                      const validation = validationResults[idx];
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2">
                            {validation?.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm">{row.business_name || '-'}</td>
                          <td className="px-4 py-2 text-sm">{row.email || '-'}</td>
                          <td className="px-4 py-2 text-sm">{row.phone || '-'}</td>
                          <td className="px-4 py-2 text-sm">
                            {row.suburb && row.postcode ? `${row.suburb}, ${row.postcode}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0}>
              Import {validCount} Prospects
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Importing prospects...</h3>
          <p className="text-gray-600">
            {stats.success} of {stats.total} imported
          </p>
          <div className="mt-4 max-w-md mx-auto">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(stats.success / stats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="py-8">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Complete!</h3>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Imported</p>
              <p className="text-3xl font-bold text-green-900">{stats.success}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-700 mb-1">Duplicates</p>
              <p className="text-3xl font-bold text-yellow-900">{stats.duplicates}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-1">Failed</p>
              <p className="text-3xl font-bold text-red-900">{stats.failed}</p>
            </div>
          </div>

          {failedRecords.length > 0 && (
            <div className="mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900 mb-2">
                      {failedRecords.length} Record{failedRecords.length !== 1 ? 's' : ''} Failed to Import
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      These records could not be imported due to validation errors, duplicates, or database issues.
                    </p>
                    <Button
                      variant="outline"
                      onClick={downloadFailedRecords}
                      className="text-sm"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Failed Records CSV
                    </Button>
                  </div>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {failedRecords.slice(0, 50).map((record, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-900">{record.row}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{record.business_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {record.email || record.phone || '-'}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            record.reason === 'duplicate'
                              ? 'bg-yellow-100 text-yellow-800'
                              : record.reason === 'validation'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {record.reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 truncate max-w-xs">
                          {record.error}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {failedRecords.length > 50 && (
                  <div className="bg-gray-50 px-4 py-2 text-sm text-gray-600 text-center">
                    Showing first 50 of {failedRecords.length} failed records. Download CSV for full list.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center">
            <Button onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

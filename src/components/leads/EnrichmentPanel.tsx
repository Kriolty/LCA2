import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Building2, DollarSign, Users, User, MapPin, Calendar, Link as LinkIcon, Sparkles, Loader } from 'lucide-react';
import { enrichLeadById, enrichmentService } from '../../lib/enrichment';
import type { CompanyEnrichment } from '../../types/crm';

interface EnrichmentPanelProps {
  leadId: string;
  companyName?: string;
  domain?: string;
  email?: string;
}

export const EnrichmentPanel = ({ leadId, companyName, domain, email }: EnrichmentPanelProps) => {
  const [enrichment, setEnrichment] = useState<CompanyEnrichment | null>(null);
  const [loading, setLoading] = useState(false);
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    loadEnrichment();
  }, [leadId]);

  const loadEnrichment = async () => {
    setLoading(true);
    try {
      const data = await enrichmentService.getEnrichmentForLead(leadId);
      setEnrichment(data);
    } catch (error) {
      console.error('Error loading enrichment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const result = await enrichLeadById(leadId, {
        name: companyName,
        domain,
        email,
      });
      if (result) {
        setEnrichment(result);
      }
    } catch (error) {
      console.error('Error enriching lead:', error);
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-gray-600">Loading enrichment data...</span>
        </div>
      </Card>
    );
  }

  if (!enrichment) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Company Intelligence Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            Enrich this lead with company data including revenue, employee count, CEO, and more
          </p>
          <Button
            onClick={handleEnrich}
            disabled={enriching}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {enriching ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Enrich Lead
              </>
            )}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            {enrichment ? 'Data available from ' + (enrichment.enrichment_source || 'external source') : 'Uses external data APIs'}
          </p>
        </div>
      </Card>
    );
  }

  const confidenceColor =
    enrichment.confidence_score && enrichment.confidence_score >= 0.7 ? 'text-green-600' :
    enrichment.confidence_score && enrichment.confidence_score >= 0.4 ? 'text-yellow-600' :
    'text-gray-600';

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Company Intelligence</h3>
              <p className="text-xs text-gray-600">
                Source: {enrichment.enrichment_source || 'Unknown'} •
                <span className={`ml-1 font-medium ${confidenceColor}`}>
                  {enrichment.confidence_score ? `${Math.round(enrichment.confidence_score * 100)}% confidence` : 'No score'}
                </span>
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleEnrich}
            disabled={enriching}
            variant="outline"
          >
            {enriching ? <Loader className="w-4 h-4 animate-spin" /> : 'Refresh'}
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {enrichment.company_name && (
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Company Name</div>
                <div className="font-medium text-gray-900">{enrichment.company_name}</div>
              </div>
            </div>
          )}

          {enrichment.domain && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Website</div>
                <a
                  href={`https://${enrichment.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {enrichment.domain}
                </a>
              </div>
            </div>
          )}

          {enrichment.revenue && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Annual Revenue</div>
                <div className="font-medium text-gray-900">
                  ${(enrichment.revenue / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>
          )}

          {enrichment.employees && (
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Employees</div>
                <div className="font-medium text-gray-900">{enrichment.employees}</div>
              </div>
            </div>
          )}

          {enrichment.ceo && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">CEO</div>
                <div className="font-medium text-gray-900">{enrichment.ceo}</div>
              </div>
            </div>
          )}

          {enrichment.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Location</div>
                <div className="font-medium text-gray-900">{enrichment.location}</div>
              </div>
            </div>
          )}

          {enrichment.industry && (
            <div className="flex items-start gap-3 col-span-2">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Industry</div>
                <div className="font-medium text-gray-900">{enrichment.industry}</div>
              </div>
            </div>
          )}

          {enrichment.founded_year && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <div className="text-xs text-gray-600">Founded</div>
                <div className="font-medium text-gray-900">{enrichment.founded_year}</div>
              </div>
            </div>
          )}
        </div>

        {enrichment.tech_stack && enrichment.tech_stack.length > 0 && (
          <div>
            <div className="text-xs text-gray-600 mb-2">Tech Stack</div>
            <div className="flex flex-wrap gap-2">
              {enrichment.tech_stack.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {enrichment.linkedin && (
          <div className="pt-4 border-t border-gray-200">
            <a
              href={enrichment.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <LinkIcon className="w-4 h-4" />
              View on LinkedIn
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};

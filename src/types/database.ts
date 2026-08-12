export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_financials: {
        Row: {
          amortisation: number
          client_id: string
          created_at: string
          currency: string
          current_assets: number
          current_liabilities: number
          depreciation: number
          earnings: number
          fiscal_quarter: number
          fiscal_week: number
          fiscal_year: number
          id: string
          lost_customers: number
          net_income: number
          non_cash_expenses: number
          submitted_by: string | null
          submitted_by_provider_id: string | null
          taxes: number
          total_customers: number
          total_equity: number
          total_liabilities: number
          updated_at: string
          working_capital_change: number
        }
        Insert: {
          amortisation?: number
          client_id: string
          created_at?: string
          currency?: string
          current_assets?: number
          current_liabilities?: number
          depreciation?: number
          earnings?: number
          fiscal_quarter: number
          fiscal_week: number
          fiscal_year: number
          id?: string
          lost_customers?: number
          net_income?: number
          non_cash_expenses?: number
          submitted_by?: string | null
          submitted_by_provider_id?: string | null
          taxes?: number
          total_customers?: number
          total_equity?: number
          total_liabilities?: number
          updated_at?: string
          working_capital_change?: number
        }
        Update: {
          amortisation?: number
          client_id?: string
          created_at?: string
          currency?: string
          current_assets?: number
          current_liabilities?: number
          depreciation?: number
          earnings?: number
          fiscal_quarter?: number
          fiscal_week?: number
          fiscal_year?: number
          id?: string
          lost_customers?: number
          net_income?: number
          non_cash_expenses?: number
          submitted_by?: string | null
          submitted_by_provider_id?: string | null
          taxes?: number
          total_customers?: number
          total_equity?: number
          total_liabilities?: number
          updated_at?: string
          working_capital_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_financials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_financials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_financials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_financials_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_financials_submitted_by_provider_id_fkey"
            columns: ["submitted_by_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_package_line_items: {
        Row: {
          client_package_id: string
          created_at: string
          fulfilment_mode: Database["public"]["Enums"]["fulfilment_mode"]
          id: string
          name: string
          quantity: number
          source_line_item_id: string | null
          tier: Database["public"]["Enums"]["service_tier"]
          unit_price: number
        }
        Insert: {
          client_package_id: string
          created_at?: string
          fulfilment_mode?: Database["public"]["Enums"]["fulfilment_mode"]
          id?: string
          name: string
          quantity?: number
          source_line_item_id?: string | null
          tier: Database["public"]["Enums"]["service_tier"]
          unit_price: number
        }
        Update: {
          client_package_id?: string
          created_at?: string
          fulfilment_mode?: Database["public"]["Enums"]["fulfilment_mode"]
          id?: string
          name?: string
          quantity?: number
          source_line_item_id?: string | null
          tier?: Database["public"]["Enums"]["service_tier"]
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_package_line_items_client_package_id_fkey"
            columns: ["client_package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_package_line_items_source_line_item_id_fkey"
            columns: ["source_line_item_id"]
            isOneToOne: false
            referencedRelation: "line_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          billing_interval:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at: string
          id: string
          name: string
          onboarding_id: string | null
          service_commencement_date: string
          source_package_id: string | null
          status: Database["public"]["Enums"]["client_package_status"]
          tier: Database["public"]["Enums"]["service_tier"] | null
          total_price: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at: string
        }
        Insert: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id: string
          created_at?: string
          id?: string
          name: string
          onboarding_id?: string | null
          service_commencement_date?: string
          source_package_id?: string | null
          status?: Database["public"]["Enums"]["client_package_status"]
          tier?: Database["public"]["Enums"]["service_tier"] | null
          total_price: number
          type: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Update: {
          billing_interval?:
            | Database["public"]["Enums"]["billing_interval"]
            | null
          client_id?: string
          created_at?: string
          id?: string
          name?: string
          onboarding_id?: string | null
          service_commencement_date?: string
          source_package_id?: string | null
          status?: Database["public"]["Enums"]["client_package_status"]
          tier?: Database["public"]["Enums"]["service_tier"] | null
          total_price?: number
          type?: Database["public"]["Enums"]["package_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboardings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_source_package_id_fkey"
            columns: ["source_package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      client_sales_targets: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          fiscal_quarter: number
          fiscal_year: number
          id: string
          revenue_target: number
          updated_at: string
        }
        Insert: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_quarter: number
          fiscal_year: number
          id?: string
          revenue_target?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fiscal_quarter?: number
          fiscal_year?: number
          id?: string
          revenue_target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sales_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sales_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sales_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_sales_targets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          artwork_path: string | null
          billing_address_line_1: string | null
          billing_address_line_2: string | null
          billing_city: string | null
          billing_contact_email: string | null
          billing_contact_name: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_province: string | null
          business_address_line_1: string | null
          business_address_line_2: string | null
          business_city: string | null
          business_country: string | null
          business_name: string
          business_postal_code: string | null
          business_province: string | null
          compliance_manager_email: string | null
          compliance_manager_name: string | null
          created_at: string
          entity_type: Database["public"]["Enums"]["client_entity_type"] | null
          external_reference: string
          id: string
          industry: string | null
          primary_contact_job_title: string | null
          primary_contact_phone: string | null
          primary_profile_id: string | null
          registered_name: string
          registration_number: string | null
          status: Database["public"]["Enums"]["client_status"]
          trading_name: string
          updated_at: string
          vat_number: string | null
          vat_status: Database["public"]["Enums"]["vat_status"] | null
        }
        Insert: {
          artwork_path?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          business_address_line_1?: string | null
          business_address_line_2?: string | null
          business_city?: string | null
          business_country?: string | null
          business_name: string
          business_postal_code?: string | null
          business_province?: string | null
          compliance_manager_email?: string | null
          compliance_manager_name?: string | null
          created_at?: string
          entity_type?: Database["public"]["Enums"]["client_entity_type"] | null
          external_reference?: string
          id?: string
          industry?: string | null
          primary_contact_job_title?: string | null
          primary_contact_phone?: string | null
          primary_profile_id?: string | null
          registered_name: string
          registration_number?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          trading_name: string
          updated_at?: string
          vat_number?: string | null
          vat_status?: Database["public"]["Enums"]["vat_status"] | null
        }
        Update: {
          artwork_path?: string | null
          billing_address_line_1?: string | null
          billing_address_line_2?: string | null
          billing_city?: string | null
          billing_contact_email?: string | null
          billing_contact_name?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          business_address_line_1?: string | null
          business_address_line_2?: string | null
          business_city?: string | null
          business_country?: string | null
          business_name?: string
          business_postal_code?: string | null
          business_province?: string | null
          compliance_manager_email?: string | null
          compliance_manager_name?: string | null
          created_at?: string
          entity_type?: Database["public"]["Enums"]["client_entity_type"] | null
          external_reference?: string
          id?: string
          industry?: string | null
          primary_contact_job_title?: string | null
          primary_contact_phone?: string | null
          primary_profile_id?: string | null
          registered_name?: string
          registration_number?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          trading_name?: string
          updated_at?: string
          vat_number?: string | null
          vat_status?: Database["public"]["Enums"]["vat_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_primary_profile_id_fkey"
            columns: ["primary_profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_document_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          required: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          required?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          required?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      default_documents: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          sort_order: number
          storage_path: string
          target_folder_slug: string | null
          updated_at: string
          work_group_id: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          sort_order?: number
          storage_path: string
          target_folder_slug?: string | null
          updated_at?: string
          work_group_id?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          sort_order?: number
          storage_path?: string
          target_folder_slug?: string | null
          updated_at?: string
          work_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "default_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "default_documents_work_group_id_fkey"
            columns: ["work_group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_profile_id: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_profile_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_profile_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      document_filings: {
        Row: {
          category_id: string
          created_at: string
          document_id: string
          owner_profile_id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          document_id: string
          owner_profile_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          document_id?: string
          owner_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_filings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_filings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_filings_owner_profile_id_fkey"
            columns: ["owner_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          client_id: string
          created_at: string
          document_type_id: string | null
          expires_at: string | null
          id: string
          issued_at: string | null
          mime_type: string | null
          onboarding_document_id: string | null
          size_bytes: number | null
          storage_path: string
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id: string
          created_at?: string
          document_type_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          onboarding_document_id?: string | null
          size_bytes?: number | null
          storage_path: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          client_id?: string
          created_at?: string
          document_type_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string | null
          mime_type?: string | null
          onboarding_document_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_onboarding_document_id_fkey"
            columns: ["onboarding_document_id"]
            isOneToOne: false
            referencedRelation: "onboarding_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_categories: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          display_order: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      line_items: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          fulfilment_mode: Database["public"]["Enums"]["fulfilment_mode"]
          id: string
          name: string
          price: number
          service_id: string
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          fulfilment_mode?: Database["public"]["Enums"]["fulfilment_mode"]
          id?: string
          name: string
          price?: number
          service_id: string
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          fulfilment_mode?: Database["public"]["Enums"]["fulfilment_mode"]
          id?: string
          name?: string
          price?: number
          service_id?: string
          tier?: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          document_id: string | null
          id: string
          read_at: string | null
          recipient_id: string
          request_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          request_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          request_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_documents: {
        Row: {
          created_at: string
          document_type_id: string
          id: string
          notes: string | null
          onboarding_id: string
          status: Database["public"]["Enums"]["compliance_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type_id: string
          id?: string
          notes?: string | null
          onboarding_id: string
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type_id?: string
          id?: string
          notes?: string | null
          onboarding_id?: string
          status?: Database["public"]["Enums"]["compliance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "compliance_document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_documents_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboardings"
            referencedColumns: ["id"]
          },
        ]
      }
      onboardings: {
        Row: {
          client_id: string
          completed_at: string | null
          compliance_request_id: string | null
          created_at: string
          id: string
          notes: string | null
          sales_rep_id: string | null
          status: Database["public"]["Enums"]["onboarding_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          compliance_request_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          sales_rep_id?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          compliance_request_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          sales_rep_id?: string | null
          status?: Database["public"]["Enums"]["onboarding_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboardings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_compliance_request_id_fkey"
            columns: ["compliance_request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboardings_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_sources: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          display_order: number
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      package_line_items: {
        Row: {
          created_at: string
          line_item_id: string
          package_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          line_item_id: string
          package_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          line_item_id?: string
          package_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_line_items_line_item_id_fkey"
            columns: ["line_item_id"]
            isOneToOne: false
            referencedRelation: "line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_line_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          active: boolean
          billing_interval: Database["public"]["Enums"]["billing_interval"]
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          slug: string
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          slug: string
          tier: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_interval?: Database["public"]["Enums"]["billing_interval"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          slug?: string
          tier?: Database["public"]["Enums"]["service_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          staff_role: Database["public"]["Enums"]["staff_role"] | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          staff_role?: Database["public"]["Enums"]["staff_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          staff_role?: Database["public"]["Enums"]["staff_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      provider_capabilities: {
        Row: {
          active: boolean
          created_at: string
          provider_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          provider_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          provider_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_capabilities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_capabilities_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          business_name: string
          created_at: string
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["provider_status"]
          tier: Database["public"]["Enums"]["provider_tier"]
          updated_at: string
        }
        Insert: {
          business_name: string
          created_at?: string
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["provider_status"]
          tier?: Database["public"]["Enums"]["provider_tier"]
          updated_at?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["provider_status"]
          tier?: Database["public"]["Enums"]["provider_tier"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "providers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_assignments: {
        Row: {
          created_at: string
          id: string
          note: string | null
          provider_id: string
          request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          provider_id: string
          request_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          provider_id?: string
          request_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_assignments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_documents: {
        Row: {
          created_at: string
          document_id: string
          request_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          request_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_events: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: string
          note: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          note?: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_events_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      request_schedules: {
        Row: {
          created_at: string
          due_at: string | null
          eta_type: Database["public"]["Enums"]["eta_type"]
          note: string | null
          request_id: string
          sla_started_at: string
          sla_target_business_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          eta_type: Database["public"]["Enums"]["eta_type"]
          note?: string | null
          request_id: string
          sla_started_at?: string
          sla_target_business_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          eta_type?: Database["public"]["Enums"]["eta_type"]
          note?: string | null
          request_id?: string
          sla_started_at?: string
          sla_target_business_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_schedules_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_opportunities: {
        Row: {
          booked_at: string | null
          client_id: string
          created_at: string
          created_by: string | null
          currency: string
          deal_reference: string
          fiscal_quarter: number | null
          fiscal_week: number | null
          fiscal_year: number | null
          forecast_category: string
          id: string
          invoice_number: string | null
          opportunity_name: string
          opportunity_source: string
          paid_at: string | null
          payment_status:
            | Database["public"]["Enums"]["opportunity_payment_status"]
            | null
          revenue: number
          updated_at: string
        }
        Insert: {
          booked_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_reference?: string
          fiscal_quarter?: number | null
          fiscal_week?: number | null
          fiscal_year?: number | null
          forecast_category?: string
          id?: string
          invoice_number?: string | null
          opportunity_name: string
          opportunity_source: string
          paid_at?: string | null
          payment_status?:
            | Database["public"]["Enums"]["opportunity_payment_status"]
            | null
          revenue?: number
          updated_at?: string
        }
        Update: {
          booked_at?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deal_reference?: string
          fiscal_quarter?: number | null
          fiscal_week?: number | null
          fiscal_year?: number | null
          forecast_category?: string
          id?: string
          invoice_number?: string | null
          opportunity_name?: string
          opportunity_source?: string
          paid_at?: string | null
          payment_status?:
            | Database["public"]["Enums"]["opportunity_payment_status"]
            | null
          revenue?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunities_forecast_category_fkey"
            columns: ["forecast_category"]
            isOneToOne: false
            referencedRelation: "forecast_categories"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "sales_opportunities_opportunity_source_fkey"
            columns: ["opportunity_source"]
            isOneToOne: false
            referencedRelation: "opportunity_sources"
            referencedColumns: ["code"]
          },
        ]
      }
      sales_opportunity_events: {
        Row: {
          actor_id: string | null
          actor_type: Database["public"]["Enums"]["opportunity_actor_type"]
          client_id: string
          created_at: string
          deal_reference: string
          details: Json
          event_type: Database["public"]["Enums"]["opportunity_event_type"]
          id: string
          opportunity_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_type: Database["public"]["Enums"]["opportunity_actor_type"]
          client_id: string
          created_at?: string
          deal_reference: string
          details?: Json
          event_type: Database["public"]["Enums"]["opportunity_event_type"]
          id?: string
          opportunity_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_type?: Database["public"]["Enums"]["opportunity_actor_type"]
          client_id?: string
          created_at?: string
          deal_reference?: string
          details?: Json
          event_type?: Database["public"]["Enums"]["opportunity_event_type"]
          id?: string
          opportunity_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_opportunity_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunity_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunity_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunity_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunity_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "sales_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      service_groups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          internal: boolean
          name: string
          submits_financials: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          internal?: boolean
          name: string
          submits_financials?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          internal?: boolean
          name?: string
          submits_financials?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          origin: Database["public"]["Enums"]["request_origin"]
          partner_work_order_reference: string | null
          provider_id: string | null
          reference: string
          request_type: Database["public"]["Enums"]["request_type"]
          sales_opportunity_id: string | null
          service_id: string
          source_line_item_id: string | null
          source_request_id: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
          work_group_id: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          origin: Database["public"]["Enums"]["request_origin"]
          partner_work_order_reference?: string | null
          provider_id?: string | null
          reference: string
          request_type?: Database["public"]["Enums"]["request_type"]
          sales_opportunity_id?: string | null
          service_id: string
          source_line_item_id?: string | null
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
          work_group_id?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          origin?: Database["public"]["Enums"]["request_origin"]
          partner_work_order_reference?: string | null
          provider_id?: string | null
          reference?: string
          request_type?: Database["public"]["Enums"]["request_type"]
          sales_opportunity_id?: string | null
          service_id?: string
          source_line_item_id?: string | null
          source_request_id?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
          work_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_sales_opportunity_id_fkey"
            columns: ["sales_opportunity_id"]
            isOneToOne: false
            referencedRelation: "sales_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_source_request_id_fkey"
            columns: ["source_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_source_line_item_id_fkey"
            columns: ["source_line_item_id"]
            isOneToOne: false
            referencedRelation: "client_package_line_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_work_group_id_fkey"
            columns: ["work_group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          created_at: string
          default_turnaround_days: number | null
          description: string | null
          group_id: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_turnaround_days?: number | null
          description?: string | null
          group_id?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_turnaround_days?: number | null
          description?: string | null
          group_id?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      work_group_conversations: {
        Row: {
          assigned_provider_id: string | null
          client_id: string
          created_at: string
          id: string
          subject: string
          updated_at: string
          work_group_id: string
        }
        Insert: {
          assigned_provider_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          subject: string
          updated_at?: string
          work_group_id: string
        }
        Update: {
          assigned_provider_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          subject?: string
          updated_at?: string
          work_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_group_conversations_assigned_provider_id_fkey"
            columns: ["assigned_provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_references"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "financial_submission_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_conversations_work_group_id_fkey"
            columns: ["work_group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      work_group_members: {
        Row: {
          created_at: string
          provider_id: string
          work_group_id: string
        }
        Insert: {
          created_at?: string
          provider_id: string
          work_group_id: string
        }
        Update: {
          created_at?: string
          provider_id?: string
          work_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_group_members_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_members_work_group_id_fkey"
            columns: ["work_group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      work_group_messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "work_group_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "work_group_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_group_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_references: {
        Row: {
          artwork_path: string | null
          business_name: string | null
          entity_type: Database["public"]["Enums"]["client_entity_type"] | null
          external_reference: string | null
          id: string | null
          industry: string | null
          registered_name: string | null
          registration_number: string | null
          trading_name: string | null
        }
        Insert: {
          artwork_path?: never
          business_name?: never
          entity_type?: never
          external_reference?: string | null
          id?: string | null
          industry?: never
          registered_name?: never
          registration_number?: never
          trading_name?: never
        }
        Update: {
          artwork_path?: never
          business_name?: never
          entity_type?: never
          external_reference?: string | null
          id?: string | null
          industry?: never
          registered_name?: never
          registration_number?: never
          trading_name?: never
        }
        Relationships: []
      }
      financial_submission_clients: {
        Row: {
          business_name: string | null
          external_reference: string | null
          id: string | null
        }
        Insert: {
          business_name?: never
          external_reference?: string | null
          id?: string | null
        }
        Update: {
          business_name?: never
          external_reference?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_assignment: {
        Args: { p_assignment_id: string }
        Returns: undefined
      }
      can_see_client_identity: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      can_submit_client_financials: {
        Args: { p_client_id: string }
        Returns: boolean
      }
      submit_client_financials: {
        Args: {
          p_amortisation?: number
          p_client_id: string
          p_current_assets?: number
          p_current_liabilities?: number
          p_depreciation?: number
          p_earnings?: number
          p_fiscal_quarter: number
          p_fiscal_week: number
          p_fiscal_year: number
          p_lost_customers?: number
          p_net_income?: number
          p_non_cash_expenses?: number
          p_taxes?: number
          p_total_customers?: number
          p_total_equity?: number
          p_total_liabilities?: number
          p_working_capital_change?: number
        }
        Returns: string
      }
      current_client_id: { Args: never; Returns: string }
      current_provider_id: { Args: never; Returns: string }
      current_user_type: {
        Args: never
        Returns: Database["public"]["Enums"]["user_type"]
      }
      complete_purchase_order_with_invoice: {
        Args: { p_document: Json; p_invoice_number: string; p_request_id: string }
        Returns: {
          delivery_reference: string
          delivery_request_id: string
        }[]
      }
      ensure_onboarding_compliance_request: {
        Args: { p_onboarding_id: string }
        Returns: string
      }
      generate_expiry_notifications: {
        Args: { p_within_days?: number }
        Returns: number
      }
      get_linked_opportunity_for_request: {
        Args: { p_request_id: string }
        Returns: {
          booked_at: string | null
          currency: string
          deal_reference: string
          fiscal_quarter: number | null
          fiscal_week: number | null
          fiscal_year: number | null
          invoice_number: string | null
          opportunity_name: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["opportunity_payment_status"] | null
          revenue: number
          updated_at: string
        }[]
      }
      is_staff: { Args: never; Returns: boolean }
      opportunity_actor_type: {
        Args: never
        Returns: Database["public"]["Enums"]["opportunity_actor_type"]
      }
      reject_assignment: {
        Args: { p_assignment_id: string; p_note?: string }
        Returns: string
      }
      review_onboarding_document: {
        Args: {
          p_decision: Database["public"]["Enums"]["compliance_status"]
          p_document_id: string
          p_message: string
        }
        Returns: undefined
      }
      route_request: { Args: { p_request_id: string }; Returns: string }
      set_linked_purchase_order_payment: {
        Args: {
          p_expected_updated_at: string
          p_payment_status: Database["public"]["Enums"]["opportunity_payment_status"]
          p_request_id: string
        }
        Returns: string
      }
      seed_default_folders: { Args: { p_owner: string }; Returns: undefined }
      submit_linked_purchase_order: {
        Args: {
          p_category_id?: string | null
          p_description: string
          p_documents: Json
          p_new_opportunity: Json
          p_opportunity_id: string | null
          p_service_id: string
          p_title: string
        }
        Returns: {
          deal_reference: string
          opportunity_id: string
          request_id: string
          request_reference: string
        }[]
      }
      update_client_booking: {
        Args: {
          p_expected_updated_at: string
          p_fiscal_quarter: number | null
          p_fiscal_week: number | null
          p_fiscal_year: number | null
          p_opportunity_id: string
          p_payment_status: Database["public"]["Enums"]["opportunity_payment_status"]
          p_revenue: number
        }
        Returns: string
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      assignment_status: "offered" | "accepted" | "rejected" | "withdrawn"
      billing_interval: "monthly" | "quarterly" | "annual" | "one_time"
      client_entity_type:
        | "private_company"
        | "public_company"
        | "personal_liability_company"
        | "non_profit_company"
        | "state_owned_company"
        | "close_corporation"
        | "cooperative"
        | "trust"
        | "sole_proprietor"
        | "partnership"
        | "other"
      client_package_status: "active" | "cancelled"
      client_status: "pending" | "active" | "suspended"
      compliance_status: "outstanding" | "received" | "verified" | "rejected"
      document_category: "compliance" | "generated" | "other"
      eta_type: "static" | "variable"
      fulfilment_mode: "service_request" | "automatic"
      message_sender_role: "client" | "provider" | "staff"
      notification_type:
        | "request_status"
        | "document_expiry"
        | "compliance_review"
      onboarding_status:
        | "draft"
        | "in_progress"
        | "awaiting_documents"
        | "completed"
        | "cancelled"
      opportunity_actor_type: "client" | "service_provider" | "staff" | "system"
      opportunity_event_type:
        | "created"
        | "updated"
        | "category_changed"
        | "booked"
        | "invoice_updated"
        | "payment_changed"
        | "deleted"
      opportunity_payment_status: "unpaid" | "paid"
      package_type: "standard" | "flex"
      provider_status: "pending" | "active" | "suspended"
      provider_tier: "standard" | "premium"
      request_origin: "system" | "client" | "provider"
      request_status:
        | "new"
        | "awaiting_assignment"
        | "open"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      request_type:
        | "general"
        | "purchase_order"
        | "tender_submission"
        | "document_delivery"
        | "rffa"
        | "rfq"
      service_tier: "basic" | "intermediate" | "professional"
      staff_role:
        | "sales_rep"
        | "sales_admin"
        | "operations"
        | "admin"
        | "marketing"
      user_type: "client" | "service_provider" | "staff"
      vat_status: "registered" | "not_registered" | "pending"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "suspended"],
      assignment_status: ["offered", "accepted", "rejected", "withdrawn"],
      billing_interval: ["monthly", "quarterly", "annual", "one_time"],
      client_entity_type: [
        "private_company",
        "public_company",
        "personal_liability_company",
        "non_profit_company",
        "state_owned_company",
        "close_corporation",
        "cooperative",
        "trust",
        "sole_proprietor",
        "partnership",
        "other",
      ],
      client_package_status: ["active", "cancelled"],
      client_status: ["pending", "active", "suspended"],
      compliance_status: ["outstanding", "received", "verified", "rejected"],
      document_category: ["compliance", "generated", "other"],
      eta_type: ["static", "variable"],
      fulfilment_mode: ["service_request", "automatic"],
      message_sender_role: ["client", "provider", "staff"],
      notification_type: [
        "request_status",
        "document_expiry",
        "compliance_review",
      ],
      onboarding_status: [
        "draft",
        "in_progress",
        "awaiting_documents",
        "completed",
        "cancelled",
      ],
      opportunity_actor_type: ["client", "service_provider", "staff", "system"],
      opportunity_event_type: [
        "created",
        "updated",
        "category_changed",
        "booked",
        "invoice_updated",
        "payment_changed",
        "deleted",
      ],
      opportunity_payment_status: ["unpaid", "paid"],
      package_type: ["standard", "flex"],
      provider_status: ["pending", "active", "suspended"],
      provider_tier: ["standard", "premium"],
      request_origin: ["system", "client", "provider"],
      request_status: [
        "new",
        "awaiting_assignment",
        "open",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      request_type: [
        "general",
        "purchase_order",
        "tender_submission",
        "document_delivery",
        "rffa",
        "rfq",
      ],
      service_tier: ["basic", "intermediate", "professional"],
      staff_role: [
        "sales_rep",
        "sales_admin",
        "operations",
        "admin",
        "marketing",
      ],
      user_type: ["client", "service_provider", "staff"],
      vat_status: ["registered", "not_registered", "pending"],
    },
  },
} as const

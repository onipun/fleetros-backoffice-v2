-- Reporting Service Tables Initialization
-- These tables are owned by reporting-service but created here to avoid
-- conflicts with backoffice-service entity schema

-- Dashboard Statistics Table
CREATE TABLE IF NOT EXISTS dashboard_statistics (
    id BIGSERIAL PRIMARY KEY,
    account_id VARCHAR(100),
    statistics_date DATE NOT NULL,
    total_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    total_vehicles INTEGER NOT NULL DEFAULT 0,
    active_bookings INTEGER NOT NULL DEFAULT 0,
    active_packages INTEGER NOT NULL DEFAULT 0,
    revenue_change_percentage NUMERIC(5,2),
    vehicles_change_percentage NUMERIC(5,2),
    bookings_change_percentage NUMERIC(5,2),
    packages_change_percentage NUMERIC(5,2),
    comparison_period VARCHAR(50),
    is_latest BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6)
);

-- Dashboard Statistics Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_date ON dashboard_statistics (statistics_date);
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_account ON dashboard_statistics (account_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_stats_account_date ON dashboard_statistics (account_id, statistics_date);

-- Revenue Reports Table
CREATE TABLE IF NOT EXISTS revenue_reports (
    id BIGSERIAL PRIMARY KEY,
    account_id VARCHAR(100),
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY','CUSTOM')),
    report_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    net_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    total_taxes NUMERIC(19,2) NOT NULL DEFAULT 0,
    total_discounts NUMERIC(19,2) NOT NULL DEFAULT 0,
    total_service_fees NUMERIC(19,2) NOT NULL DEFAULT 0,
    vehicle_rental_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    offering_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    package_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    booking_revenue NUMERIC(19,2) NOT NULL DEFAULT 0,
    booking_count INTEGER NOT NULL DEFAULT 0,
    completed_bookings INTEGER NOT NULL DEFAULT 0,
    cancelled_bookings INTEGER NOT NULL DEFAULT 0,
    average_booking_value NUMERIC(19,2),
    currency VARCHAR(3) DEFAULT 'USD',
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6)
);

-- Revenue Reports Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_report_date ON revenue_reports (report_date);
CREATE INDEX IF NOT EXISTS idx_revenue_report_account ON revenue_reports (account_id);
CREATE INDEX IF NOT EXISTS idx_revenue_report_period ON revenue_reports (period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_revenue_report_type ON revenue_reports (report_type);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Reporting tables initialized successfully';
END $$;

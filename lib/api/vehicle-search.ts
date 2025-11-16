/**
 * Vehicle Search API Client
 * 
 * Enterprise-grade API client for vehicle search operations following SOLID principles:
 * - Single Responsibility: Handles only vehicle search API calls
 * - Open/Closed: Extensible for new search criteria
 * - Interface Segregation: Clean, focused API
 * 
 * Based on VEHICLE_SEARCH_API.md specification
 */

import type { HATEOASCollection, Vehicle } from '@/types';
import { hateoasClient } from './hateoas-client';

import type { CarType } from '@/types';

/**
 * Vehicle status enum
 */
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'UNAVAILABLE';

/**
 * Search parameters interface
 * Following VEHICLE_SEARCH_API.md specification with all 24 search methods
 */
export interface VehicleSearchParams {
  // Pagination
  page?: number;
  size?: number;
  sort?: string;
  
  // Search criteria
  status?: VehicleStatus;
  name?: string;
  make?: string;
  model?: string;
  licensePlate?: string;
  carType?: CarType;
  seaterCount?: number;
  minSeats?: number;
  maxSeats?: number;
}

/**
 * Search vehicles with flexible criteria
 * Automatically selects the most appropriate search endpoint based on provided parameters
 * Supports all 24 search methods from VEHICLE_SEARCH_API.md
 * 
 * @param params - Search parameters
 * @returns Paginated vehicle results
 * 
 * @example
 * // Enterprise search: Available Tesla Model X SUVs
 * const results = await searchVehicles({ status: 'AVAILABLE', make: 'tesla', model: 'model x', carType: 'SUV' });
 * 
 * @example
 * // Category + seating: Available 7-seater SUVs
 * const results = await searchVehicles({ status: 'AVAILABLE', carType: 'SUV', seaterCount: 7 });
 * 
 * @example
 * // Flexible seating: SUVs with 5-8 seats
 * const results = await searchVehicles({ status: 'AVAILABLE', carType: 'SUV', minSeats: 5, maxSeats: 8 });
 */
export async function searchVehicles(
  params: VehicleSearchParams = {}
): Promise<HATEOASCollection<Vehicle>> {
  const { 
    status, name, make, model, licensePlate, carType, seaterCount, minSeats, maxSeats,
    page = 0, size = 20, sort = 'name,asc' 
  } = params;
  
  // Build search parameters
  const searchParams = { page, size, sort };
  
  // Priority-based endpoint selection (most specific to least specific)
  // Following SOLID principles: Open/Closed - extensible without modification
  
  // Method #24: Ultimate filter - Status + Make + Model + CarType
  if (status && make && model && carType) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndMakeContainingIgnoreCaseAndModelContainingIgnoreCaseAndCarType', {
      ...searchParams, status, make, model, carType
    });
  }
  
  // Method #17: Status + Model + CarType
  if (status && model && carType) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndModelContainingIgnoreCaseAndCarType', {
      ...searchParams, status, model, carType
    });
  }
  
  // Method #20: Status + Make + Model
  if (status && make && model) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndMakeContainingIgnoreCaseAndModelContainingIgnoreCase', {
      ...searchParams, status, make, model
    });
  }
  
  // Method #19: Status + Make + CarType
  if (status && make && carType) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndMakeContainingIgnoreCaseAndCarType', {
      ...searchParams, status, make, carType
    });
  }
  
  // Method #23: Status + Make + Min Seats
  if (status && make && minSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndMakeContainingIgnoreCaseAndSeaterCountGreaterThanEqual', {
      ...searchParams, status, make, minSeats
    });
  }
  
  // Method #22: Status + CarType + Seat Range
  if (status && carType && minSeats && maxSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndCarTypeAndSeaterCountBetween', {
      ...searchParams, status, carType, minSeats, maxSeats
    });
  }
  
  // Method #16: Status + CarType + Min Seats
  if (status && carType && minSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndCarTypeAndSeaterCountGreaterThanEqual', {
      ...searchParams, status, carType, minSeats
    });
  }
  
  // Method #18: Status + CarType + Exact Seats
  if (status && carType && seaterCount) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndCarTypeAndSeaterCount', {
      ...searchParams, status, carType, seaterCount
    });
  }
  
  // Method #10: Status + CarType
  if (status && carType) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndCarType', {
      ...searchParams, status, carType
    });
  }
  
  // Method #21: CarType + Seat Range
  if (carType && minSeats && maxSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByCarTypeAndSeaterCountBetween', {
      ...searchParams, carType, minSeats, maxSeats
    });
  }
  
  // Method #15: CarType + Exact Seats
  if (carType && seaterCount) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByCarTypeAndSeaterCount', {
      ...searchParams, carType, seaterCount
    });
  }
  
  // Method #2: Status + Name
  if (status && name) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndNameContainingIgnoreCase', {
      ...searchParams, status, name
    });
  }
  
  // Method #5: Status + Make
  if (status && make) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndMakeContainingIgnoreCase', {
      ...searchParams, status, make
    });
  }
  
  // Method #12: Status + Exact Seats
  if (status && seaterCount) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatusAndSeaterCount', {
      ...searchParams, status, seaterCount
    });
  }
  
  // Method #14: Seat Range
  if (minSeats && maxSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findBySeaterCountBetween', {
      ...searchParams, minSeats, maxSeats
    });
  }
  
  // Method #13: Min Seats
  if (minSeats) {
    return hateoasClient.search<Vehicle>('vehicles', 'findBySeaterCountGreaterThanEqual', {
      ...searchParams, minSeats
    });
  }
  
  // Method #11: Exact Seats
  if (seaterCount) {
    return hateoasClient.search<Vehicle>('vehicles', 'findBySeaterCount', {
      ...searchParams, seaterCount
    });
  }
  
  // Method #9: CarType only
  if (carType) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByCarType', {
      ...searchParams, carType
    });
  }
  
  // Method #1: Status only
  if (status) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByStatus', {
      ...searchParams, status
    });
  }
  
  // Method #6: License Plate
  if (licensePlate) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByLicensePlateContainingIgnoreCase', {
      ...searchParams, licensePlate
    });
  }
  
  // Method #3: Name only
  if (name) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByNameContainingIgnoreCase', {
      ...searchParams, name
    });
  }
  
  // Method #4: Make OR Model
  if (make && model) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByMakeContainingIgnoreCaseOrModelContainingIgnoreCase', {
      ...searchParams, make, model
    });
  }
  
  // Method #7: Make only
  if (make) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByMakeContainingIgnoreCase', {
      ...searchParams, make
    });
  }
  
  // Method #8: Model only
  if (model) {
    return hateoasClient.search<Vehicle>('vehicles', 'findByModelContainingIgnoreCase', {
      ...searchParams, model
    });
  }
  
  // Default: get all vehicles
  return hateoasClient.getCollection<Vehicle>('vehicles', searchParams);
}

/**
 * Search vehicles by status only
 */
export async function searchByStatus(
  status: VehicleStatus,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ status, page, size, sort });
}

/**
 * Search vehicles by status AND name
 */
export async function searchByStatusAndName(
  status: VehicleStatus,
  name: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ status, name, page, size, sort });
}

/**
 * Search vehicles by name only
 */
export async function searchByName(
  name: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ name, page, size, sort });
}

/**
 * Search vehicles by make OR model
 */
export async function searchByMakeOrModel(
  make: string,
  model: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ make, model, page, size, sort });
}

/**
 * Search vehicles by status AND make
 */
export async function searchByStatusAndMake(
  status: VehicleStatus,
  make: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ status, make, page, size, sort });
}

/**
 * Search vehicles by license plate
 */
export async function searchByLicensePlate(
  licensePlate: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ licensePlate, page, size, sort });
}

/**
 * Search vehicles by make only
 */
export async function searchByMake(
  make: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ make, page, size, sort });
}

/**
 * Search vehicles by model only
 */
export async function searchByModel(
  model: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'name,asc'
): Promise<HATEOASCollection<Vehicle>> {
  return searchVehicles({ model, page, size, sort });
}

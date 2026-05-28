export const COUNTRIES = [
  'India',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'Brazil',
  'Other'
];

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
  'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const CANADIAN_PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Northwest Territories', 'Nunavut', 'Yukon'
];

export const UK_REGIONS = [
  'England', 'Scotland', 'Wales', 'Northern Ireland'
];

export const getStatesByCountry = (country: string): string[] => {
  if (!country) return [];
  switch (country.trim()) {
    case 'India':
      return INDIAN_STATES;
    case 'United States':
      return US_STATES;
    case 'Canada':
      return CANADIAN_PROVINCES;
    case 'United Kingdom':
      return UK_REGIONS;
    default:
      return [];
  }
};

// Common major cities by country
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'India': [
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune',
    'Kolkata', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Indore',
    'Chandigarh', 'Bhopal', 'Coimbatore', 'Visakhapatnam'
  ],
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
    'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
    'Denver', 'Seattle', 'Atlanta', 'Boston'
  ],
  'Canada': [
    'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa',
    'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener', 'London', 'Halifax'
  ],
  'United Kingdom': [
    'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool',
    'Newcastle', 'Sheffield', 'Bristol', 'Edinburgh', 'Belfast'
  ],
  'Australia': [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart',
    'Canberra', 'Darwin', 'Gold Coast', 'Newcastle'
  ],
  'Germany': [
    'Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne', 'Stuttgart',
    'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig', 'Dresden', 'Hanover'
  ],
  'France': [
    'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes',
    'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes'
  ],
  'Japan': [
    'Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Sapporo', 'Fukuoka',
    'Kobe', 'Kyoto', 'Kawasaki', 'Saitama', 'Hiroshima', 'Sendai'
  ],
  'China': [
    'Shanghai', 'Beijing', 'Guangzhou', 'Chengdu', 'Shenzhen', 'Tianjin',
    'Hangzhou', 'Wuhan', 'Chongqing', 'Xi\'an', 'Nanjing', 'Suzhou'
  ],
  'Brazil': [
    'São Paulo', 'Rio de Janeiro', 'Salvador', 'Fortaleza', 'Belo Horizonte',
    'Brasília', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'
  ]
};

export const getCitiesByCountry = (country: string): string[] => {
  if (!country) return [];
  return CITIES_BY_COUNTRY[country.trim()] || [];
};

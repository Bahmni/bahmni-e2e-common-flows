const endpoints = {
    DIAGNOSIS_SEARCH:"/openmrs/ws/rest/v1/concept",
    SNOWSTORM_URL:"https://snowstorm.snomed.mybahmni.in/fhir/ValueSet/$expand",
    ECL_QUERY:"http://snomed.info/sct?fhir_vs=ecl/<<",
    VALUESET_URL:"http://bahmni.org/fhir/ValueSet/bahmni-valueset-hospitalisation",
    VALUESET_URL_PROCEDURE:"http://bahmni.org/fhir/ValueSet/bahmni-procedures-head",
    CDSS_ENABLE_URL:"/openmrs/ws/rest/v1/bahmnicore/sql/globalproperty?property=cdss.enable",
    PROCEDURE_ORDERS:"/openmrs/ws/rest/v1/terminologyServices/valueSet",
    FHIR_EXPORT:"/openmrs/ws/rest/v1/fhirexport",
}

module.exports = {
    endpoints
};
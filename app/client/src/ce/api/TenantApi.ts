import type { AxiosPromise } from "axios";
import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export type FetchCurrentTenantConfigResponse = ApiResponse<{
  userPermissions: string[];
  tenantConfiguration: Record<string, string>;
  new: boolean;
}>;

export type UpdateTenantConfigResponse = ApiResponse<{
  tenantConfiguration: Record<string, string>;
}>;

export type UpdateTenantConfigRequest = {
  tenantConfiguration: Record<string, string>;
  needsRefresh?: boolean;
  isOnlyTenantSettings?: boolean;
};

export class TenantApi extends Api {
  static tenantsUrl = "v1/tenants";

  static async fetchCurrentTenantConfig(): Promise<
    AxiosPromise<FetchCurrentTenantConfigResponse>
  > {
    return Api.get(`${TenantApi.tenantsUrl}/current`);
  }

  static async updateTenantConfig(
    request: UpdateTenantConfigRequest,
  ): Promise<AxiosPromise<UpdateTenantConfigResponse>> {
    return Api.put(`${TenantApi.tenantsUrl}`, request.tenantConfiguration);
  }
}

export default TenantApi;

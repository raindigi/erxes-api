import * as Random from 'meteor-random';
import { Model, model } from 'mongoose';
import { debugBase } from '../../debuggers';
import { Integrations } from './';
import { brandSchema, IBrand, IBrandDocument, IBrandEmailConfig } from './definitions/brands';
import { IIntegrationDocument } from './definitions/integrations';

export interface IBrandModel extends Model<IBrandDocument> {
  generateCode(code: string): string;
  createBrand(doc: IBrand): IBrandDocument;
  updateBrand(_id: string, fields: IBrand): IBrandDocument;
  removeBrand(_id: string): void;

  updateEmailConfig(_id: string, emailConfig: IBrandEmailConfig): IBrandDocument;

  manageIntegrations({ _id, integrationIds }: { _id: string; integrationIds: string[] }): IIntegrationDocument[];
}

export const loadClass = () => {
  class Brand {
    public static async generateCode(code?: string) {
      let generatedCode = code || Random.id().substr(0, 6);

      let prevBrand = await Brands.findOne({ code: generatedCode });

      // search until not existing one found
      while (prevBrand) {
        generatedCode = Random.id().substr(0, 6);

        if (code) {
          debugBase('User defined brand code already exists. New code is generated.');
        }

        prevBrand = await Brands.findOne({ code: generatedCode });
      }

      return generatedCode;
    }

    public static async createBrand(doc: IBrand) {
      // generate code automatically
      // if there is no brand code defined
      return Brands.create({
        ...doc,
        code: await this.generateCode(),
        createdAt: new Date(),
        emailConfig: { type: 'simple' },
      });
    }

    public static async updateBrand(_id: string, fields: IBrand) {
      await Brands.updateOne({ _id }, { $set: { ...fields } });
      return Brands.findOne({ _id });
    }

    public static async removeBrand(_id) {
      const brandObj = await Brands.findOne({ _id });

      if (!brandObj) {
        throw new Error(`Brand not found with id ${_id}`);
      }

      return brandObj.remove();
    }

    public static async updateEmailConfig(_id: string, emailConfig: IBrandEmailConfig) {
      await Brands.updateOne({ _id }, { $set: { emailConfig } });

      return Brands.findOne({ _id });
    }

    public static async manageIntegrations({ _id, integrationIds }: { _id: string; integrationIds: string[] }) {
      await Integrations.updateMany({ _id: { $in: integrationIds } }, { $set: { brandId: _id } }, { multi: true });

      return Integrations.find({ _id: { $in: integrationIds } });
    }
  }

  brandSchema.loadClass(Brand);
};

loadClass();

// tslint:disable-next-line
const Brands = model<IBrandDocument, IBrandModel>('brands', brandSchema);

export default Brands;

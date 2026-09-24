import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(
        private readonly reflector: Reflector,
        @InjectDataSource() private readonly dataSource: DataSource,
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean>{
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())

        if(!requiredRoles || requiredRoles.length === 0){
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authId = request.user?.sub;

        if (!authId){
            throw new Error ('No Authenticated User Found')
        }

        const result = await this.dataSource.query<{ role: string}[]>(
            'SELECT role FROM shared_accounts WHERE auth_id = $1', 
            [authId]
        );

        if (result.length ===0){
            throw new Error("No account found for this user")
        }

        const userRole = result[0].role;

        if (!requiredRoles.includes(userRole)){
            throw new Error("Insufficient Permissions")
        }

        return true;
    }


}


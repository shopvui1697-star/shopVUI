import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';

@Controller('addresses')
@ApiTags('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List user addresses' })
  async findAll(@Req() req: any) {
    return this.addressesService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an address' })
  async create(@Req() req: any, @Body() body: any) {
    return this.addressesService.create(req.user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.addressesService.update(id, req.user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.delete(id, req.user.id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  async setDefault(@Req() req: any, @Param('id') id: string) {
    return this.addressesService.setDefault(id, req.user.id);
  }
}

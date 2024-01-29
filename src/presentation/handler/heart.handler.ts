import { HeartServiceInterface } from '@/domain/services/heart/heart.service.interface';
import {
    Body,
    Controller,
    Get,
    HttpException,
    Inject,
    InternalServerErrorException,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { HeartQuantityDto } from '../dtos/heart/heart.quantity';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../guard/admin.guard';
import { HeartRechargeBonusDto } from '../dtos/heart/heart.recharge.bonus.dto';
import { HeartRechargeRegularDto } from '../dtos/heart/heart.recharge.regular.dto';
import { MemberGuard } from '../guard/member.guard';
import { MemberDecorator } from '../decorator/member.decorator';

@Controller('hearts')
@ApiTags('Hearts')
export class HeartController {
    constructor(
        @Inject('HEART_SERVICE')
        private readonly service: HeartServiceInterface,
    ) {}
    @Get()
    @ApiOperation({ summary: 'my hearts quantity' })
    private async hearts(@Query() { memberId }: HeartQuantityDto) {
        try {
            const quantity = await this.service.getTotalHearts(memberId);
            return { quantity };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            } else {
                throw new InternalServerErrorException();
            }
        }
    }
    @Post('/bonus')
    @UseGuards(AdminGuard)
    @ApiOperation({ summary: 'recharge bonus hearts' })
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiBody({ type: HeartRechargeBonusDto })
    private async rechargeBonusHearts(
        @Body() { memberId, quantity, expiryDate }: HeartRechargeBonusDto,
    ) {
        try {
            return await this.service.rechargeBonusHearts(
                memberId,
                quantity,
                expiryDate,
            );
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw new InternalServerErrorException();
            } else if (error instanceof Error) {
                throw new Error(error.message);
            }
        }
    }
    @Post('/regular')
    @UseGuards(MemberGuard)
    @ApiOperation({ summary: 'recharge regular hearts' })
    @ApiConsumes('application/x-www-form-urlencoded')
    @ApiBody({ type: HeartRechargeRegularDto })
    private async rechargeRegularHearts(
        @MemberDecorator() memberId: string,
        @Body() { quantity }: HeartRechargeRegularDto,
    ) {
        try {
            return await this.service.rechargeRegularHearts(memberId, quantity);
        } catch (error) {
            if (error instanceof InternalServerErrorException) {
                throw new InternalServerErrorException();
            } else if (error instanceof Error) {
                throw new Error(error.message);
            }
        }
    }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'persona@correo.cl' }) @IsEmail() email!: string;
  @ApiProperty({ minLength: 10 }) @IsString() @Length(10, 128) password!: string;
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean() rememberMe?: boolean;
}
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @Length(1, 128) password!: string;
  @ApiProperty({ required: false, default: false }) @IsOptional() @IsBoolean() rememberMe?: boolean;
}
